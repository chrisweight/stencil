import * as d from '../../declarations';
import { patchTextContent } from '../dom-extras';

describe('dom-extras', () => {
  describe('patchTextContent', () => {
    it('BLAH IF UNDEFINED', () => {
      fail('TODO');
    });

    describe('get()', () => {
      let elementWithChildSlot: d.HostElement;
      let slotElement: d.HostElement;

      beforeEach(() => {
        // slotElement = document.createElement('slot');
        // elementWithChildSlot = document.createElement('label');
        // elementWithChildSlot.appendChild(slotElement);
      });

      it('returns the text content from an unnamed child slot element', () => {

        slotElement = document.createElement('slot');
        elementWithChildSlot = document.createElement('label');
        elementWithChildSlot.appendChild(slotElement);
        patchTextContent(elementWithChildSlot);

        expect(elementWithChildSlot.textContent).toEqual('FAIL')
      });

      it('acts as a pass through for a slot child with a name', () => {
        slotElement = document.createElement('slot');
        slotElement.setAttribute('name', 'my-name');
        slotElement.textContent = 'fallback content';

        elementWithChildSlot = document.createElement('label');
        elementWithChildSlot.appendChild(slotElement);
        patchTextContent(elementWithChildSlot);

        expect(elementWithChildSlot.textContent).toEqual('FAIL')
      });

      it('acts as a pass through for non-slotted children', () => {
        const divElement = document.createElement('div');
        const labelElement = document.createElement('label');
        labelElement.appendChild(divElement);
        patchTextContent(elementWithChildSlot);

        expect(elementWithChildSlot.textContent).toEqual('FAIL')
      });

      it('acts as a pass through for no children elements', () => {
        fail('TODO');
      });
    });

    describe('set()', () => {
      it('sets text on a slot node without a name', () => {
        fail('TODO');
      });

      // it('', ());
    });
  });
});
