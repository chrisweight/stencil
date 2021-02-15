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
   * 2. Has the structure that we intend it to
   *
   * @returns the validated label
   */
  function validateAndGetLabel(): HTMLLabelElement {
    if(!app) {
      fail('The root application has not been defined. Did you forget to call `setupDom()`?');
    }

    const cmpLabelComponent: HTMLCmpLabelElement = app.querySelector('cmp-label');
    expect(cmpLabelComponent).toBeDefined();

    const label: HTMLLabelElement = cmpLabelComponent.querySelector('label');
    expect(label).toBeDefined();

    /**
     * Expect three child nodes in the label
     * - a content reference text node
     * - the slotted text node
     * - the non-slotted text
     */
    expect(label.childNodes.length).toBe(3);

    return label;
  }

  // it('renders text as if there were a slot available', async () => {
  //   const label = validateAndGetLabel();
  //   expect(label.childNodes[1].textContent).toBe("This text should go in a slot");
  // });
  //
  // it('renders non-slotted text', () => {
  //   const label = validateAndGetLabel();
  //   expect(label.childNodes[2].textContent).toBe("Non-slotted text");
  // });

  it("doesn't override all children when assigning textContent", () => {
    const cmpLabelComponent: HTMLCmpLabelElement = app.querySelector('cmp-label');
    expect(cmpLabelComponent).toBeDefined();

    cmpLabelComponent.textContent = "New text";
    console.log(cmpLabelComponent.childNodes)

    /**
     * Expect three child nodes in the label
     * - a content reference text node
     * - the slotted text node with the new text
     * - the non-slotted text
     */
    expect(cmpLabelComponent.childNodes.length).toBe(3);
    expect(cmpLabelComponent.childNodes[2].textContent).toBe("New textThis text should go in a slot");
    expect(cmpLabelComponent.childNodes[3].textContent).toBe("Non-slotted text");
  });
});
