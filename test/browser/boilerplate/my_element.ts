import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class MyElement extends LitElement {
  @property({ type: Promise })
  promise: Promise<boolean> | undefined = undefined;

  async getFileContent(path: string) {
    const mainnrSourceURL = new URL(path, import.meta.url);
    const response = await fetch(mainnrSourceURL);
    return await response.text();
  }

  async handleAbiEncodeButton() {
    this.promise = new Promise((resolve, reject) => {
      try {
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  }

  render() {
    return html`<button @click=${this.handleAbiEncodeButton} />`;
  }
}
