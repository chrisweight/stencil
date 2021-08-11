import { setupDomTests } from '../util';

describe('scoped-slot-text', () => {
  const { setupDom, tearDownDom } = setupDomTests(document);
  let app: HTMLElement | undefined;

  beforeEach(async () => {
    app = await setupDom('/scoped-slot-text/index.html');
  });

  afterEach(tearDownDom);

  /**
   * Helper function to validate that the `HTMLLabelElement` used in this test suite:
   * 1. Exists and can be found by querying the DOM
   * 2. Has the number of children we expect it to
   * @returns the validated label
   */
  function getCmpLabelCustomElement(): HTMLCmpLabelElement {
    const cmpLabelComponent: HTMLCmpLabelElement = app.querySelector('cmp-label');
    expect(cmpLabelComponent).toBeDefined();

    return cmpLabelComponent;
  }

  it('leaves the structure of the label intact', () => {
    const cmpLabelComponent: HTMLCmpLabelElement = getCmpLabelCustomElement();

    cmpLabelComponent.textContent = 'New text';

    const label: HTMLLabelElement = cmpLabelComponent.querySelector('label');

    /**
     * Expect three child nodes in the label
     * - a content reference text node
     * - the slotted text node
     * - the non-slotted text
     */
    expect(label).toBeDefined();
    expect(label.childNodes.length).toBe(3);
  });

  it('sets the textContent in the slot-like location', () => {
    const cmpLabelComponent: HTMLCmpLabelElement = getCmpLabelCustomElement();

    cmpLabelComponent.textContent = 'New text';

    expect(cmpLabelComponent.textContent).toBe('New text');
  });

  it("doesn't override all children when assigning textContent", () => {
    const cmpLabelComponent: HTMLCmpLabelElement = getCmpLabelCustomElement();

    cmpLabelComponent.textContent = 'New text';

    const divElement: HTMLDivElement = cmpLabelComponent.querySelector('div');
    expect(divElement?.textContent).toBe('Non-slotted text');
  });
});
