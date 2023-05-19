import { html, fixture, expect } from "@open-wc/testing";
import "../../my-element.js";

describe("noir wasm compilation", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let element: any;

  before(async () => {
    element = await fixture(html`<my-element />`);
    element.shadowRoot.querySelector("button").click();
  });

  it("matches nargos compilation", async () => {
    expect(await element.promise).to.equal(true);
  }).timeout(10e3);
});
