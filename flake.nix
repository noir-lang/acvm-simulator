{
  description = "ACVM Simulator";

  inputs = {
    nixpkgs = {
      url = "github:NixOS/nixpkgs/nixos-22.11";
    };

    flake-utils = {
      url = "github:numtide/flake-utils";
    };

    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };

    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      # All of these inputs (a.k.a. dependencies) need to align with inputs we
      # use so they use the `inputs.*.follows` syntax to reference our inputs
      inputs = {
        nixpkgs.follows = "nixpkgs";
        flake-utils.follows = "flake-utils";
      };
    };

    crane = {
      url = "github:ipetkov/crane";
      # All of these inputs (a.k.a. dependencies) need to align with inputs we
      # use so they use the `inputs.*.follows` syntax to reference our inputs
      inputs = {
        nixpkgs.follows = "nixpkgs";
        flake-utils.follows = "flake-utils";
        flake-compat.follows = "flake-compat";
        rust-overlay.follows = "rust-overlay";
      };
    };

  };

  outputs =
    { self, nixpkgs, crane, flake-utils, rust-overlay, ... }: #, barretenberg
    flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [
          rust-overlay.overlays.default
          # barretenberg.overlays.default
        ];
      };

      rustToolchain = pkgs.rust-bin.stable."1.66.0".default.override {
        # We include rust-src to ensure rust-analyzer works.
        # See https://discourse.nixos.org/t/rust-src-not-found-and-other-misadventures-of-developing-rust-on-nixos/11570/4
        extensions = [ "rust-src" ];
        targets = [ "wasm32-unknown-unknown" ]
          ++ pkgs.lib.optional (pkgs.hostPlatform.isx86_64 && pkgs.hostPlatform.isLinux) "x86_64-unknown-linux-gnu"
          ++ pkgs.lib.optional (pkgs.hostPlatform.isAarch64 && pkgs.hostPlatform.isLinux) "aarch64-unknown-linux-gnu"
          ++ pkgs.lib.optional (pkgs.hostPlatform.isx86_64 && pkgs.hostPlatform.isDarwin) "x86_64-apple-darwin"
          ++ pkgs.lib.optional (pkgs.hostPlatform.isAarch64 && pkgs.hostPlatform.isDarwin) "aarch64-apple-darwin";
      };

      craneLib = (crane.mkLib pkgs).overrideToolchain rustToolchain;

      sharedEnvironment = {
        # Barretenberg fails if tests are run on multiple threads, so we set the test thread
        # count to 1 throughout the entire project
        #
        # Note: Setting this allows for consistent behavior across build and shells, but is mostly
        # hidden from the developer - i.e. when they see the command being run via `nix flake check`
        RUST_TEST_THREADS = "1";
      };

      sourceFilter = path: type:
        (craneLib.filterCargoSources path type);

      # The `self.rev` property is only available when the working tree is not dirty
      GIT_COMMIT = if (self ? rev) then self.rev else "unknown";
      GIT_DIRTY = if (self ? rev) then "false" else "true";

      commonArgs = {
        pname = "acvm-simulator";
        # x-release-please-start-version
        version = "0.1.0";
        # x-release-please-end

        src = pkgs.lib.cleanSourceWith {
          src = craneLib.path ./.;
          filter = sourceFilter;
        };

        # Running checks don't do much more than compiling itself and increase
        # the build time by a lot, so we disable them throughout all our flakes
        doCheck = false;
      };

      # Combine the environment and other configuration needed for crane to build with the wasm feature
      wasmArgs = commonArgs // {
        buildInputs = [ ];

      };

      # Build *just* the cargo dependencies, so we can reuse all of that work between runs
      # native-cargo-artifacts = craneLib.buildDepsOnly nativeArgs;
      wasm-cargo-artifacts = craneLib.buildDepsOnly wasmArgs;

      cargoArtifacts = craneLib.buildDepsOnly wasmArgs;

      wasm-bindgen-cli = pkgs.callPackage ./nix/wasm-bindgen-cli/default.nix {
        rustPlatform = pkgs.makeRustPlatform {
          rustc = rustToolchain;
          cargo = rustToolchain;
        };
      };
    in
    rec {
      packages.default = craneLib.mkCargoDerivation (wasmArgs // rec {
        pname = "acvm-simulator-wasm";
        # version = "1.0.0";

        inherit cargoArtifacts;
        inherit GIT_COMMIT;
        inherit GIT_DIRTY;

        COMMIT_SHORT = builtins.substring 0 7 GIT_COMMIT;
        VERSION_APPENDIX = if GIT_DIRTY == "true" then "-dirty" else "";

        src = ./.; #craneLib.cleanCargoSource (craneLib.path ./.);

        nativeBuildInputs = with pkgs; [
          binaryen
          which
          git
          jq
          rustToolchain
          wasm-bindgen-cli
          wasm-pack
        ];

        buildPhaseCargoCommand = ''
          cargo build --lib --release --target wasm32-unknown-unknown
          wasm-bindgen ./target/wasm32-unknown-unknown/release/acvm_simulator.wasm --out-dir ./pkg/nodejs --typescript --target nodejs
          wasm-bindgen ./target/wasm32-unknown-unknown/release/acvm_simulator.wasm --out-dir ./pkg/browser --typescript --target web
          wasm-opt ./pkg/nodejs/acvm_simulator_bg.wasm -o ./pkg/nodejs/acvm_simulator_bg.wasm -O
          wasm-opt ./pkg/web/acvm_simulator_bg.wasm -o ./pkg/web/acvm_simulator_bg.wasm -O
          ls ./pkg/ -R -lah
        '';

        installPhase = ''
          mkdir -p $out
          cp README.md $out
          cp -r ./pkg/* $out/
          cat package.json \
          | jq '{ name, version, collaborators, license } 
            | .repository = {"type": "git","url": "https://github.com/noir-lang/acvm-simulator-wasm.git"} 
            | .sideEffects = false | .files = ["nodejs","web","package.json"] 
            | .main = "./nodejs/acvm_simulator.js" 
            | .types = "./web/acvm_simulator.d.ts" 
            | .module = "./web/acvm_simulator.js"' \
          > $out/package.json
        '';

      });

      # Setup the environment to match the stdenv from `nix build` & `nix flake check`, and
      # combine it with the environment settings, the inputs from our checks derivations,
      # and extra tooling via `nativeBuildInputs`
      devShells.default = pkgs.mkShell ({
        # inputsFrom = builtins.attrValues checks;

        nativeBuildInputs = with pkgs; [
          nil
          nixpkgs-fmt
          which
          git
          jq
          rustToolchain
          wasm-bindgen-cli
          wasm-pack
        ];

        shellHook = ''
          eval "$(starship init bash)"
        '';
      });
    });
}
