import type * as d from '../declarations';
import { BUILD } from '@app-data';
import { CMP_FLAGS, HOST_FLAGS } from '@utils';
import { PLATFORM_FLAGS } from './runtime-constants';
import { plt, supportsShadow, getHostRef } from '@platform';

export const patchCloneNode = (HostElementPrototype: any) => {
  const orgCloneNode = HostElementPrototype.cloneNode;

  HostElementPrototype.cloneNode = function (deep?: boolean) {
    const srcNode = this;
    const isShadowDom = BUILD.shadowDom ? srcNode.shadowRoot && supportsShadow : false;
    const clonedNode = orgCloneNode.call(srcNode, isShadowDom ? deep : false) as Node;
    if (BUILD.slot && !isShadowDom && deep) {
      let i = 0;
      let slotted, nonStencilNode;
      let stencilPrivates = ['s-id', 's-cr', 's-lr', 's-rc', 's-sc', 's-p', 's-cn', 's-sr', 's-sn', 's-hn', 's-ol', 's-nr', 's-si'];

      for (; i < srcNode.childNodes.length; i++) {
        slotted = (srcNode.childNodes[i] as any)['s-nr'];
        nonStencilNode = stencilPrivates.every((privateField) => !(srcNode.childNodes[i] as any)[privateField]);
        if (slotted) {
          if (BUILD.appendChildSlotFix && (clonedNode as any).__appendChild) {
            (clonedNode as any).__appendChild(slotted.cloneNode(true));
          } else {
            clonedNode.appendChild(slotted.cloneNode(true));
          }
        }
        if (nonStencilNode) {
          clonedNode.appendChild((srcNode.childNodes[i] as any).cloneNode(true));
        }
      }
    }
    return clonedNode;
  };
};

export const patchSlotAppendChild = (HostElementPrototype: any) => {
  HostElementPrototype.__appendChild = HostElementPrototype.appendChild;
  HostElementPrototype.appendChild = function (this: d.RenderNode, newChild: d.RenderNode) {
    const slotName = (newChild['s-sn'] = getSlotName(newChild));
    const slotNode = getHostSlotNode(this.childNodes, slotName);
    if (slotNode) {
      const slotChildNodes = getHostSlotChildNodes(slotNode, slotName);
      const appendAfter = slotChildNodes[slotChildNodes.length - 1];
      return appendAfter.parentNode.insertBefore(newChild, appendAfter.nextSibling);
    }
    return (this as any).__appendChild(newChild);
  };
};

/**
 * Patches the text content of an unnamed slotted node in a scoped component
 * @param HostElementPrototype the Element to be patched
 */
export const patchTextContent = (HostElementPrototype: HTMLElement): void => {
  const descriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  Object.defineProperty(HostElementPrototype, '__textContent', descriptor);

  Object.defineProperty(HostElementPrototype, 'textContent', {
    get(): string | null {
      const slotNode = getHostSlotNode(this.childNodes, '');
      console.log('GET: got slotNode', JSON.stringify(slotNode, null, 2));
      if (slotNode) {
        console.log('text content is ', slotNode.textContent)
        return slotNode.nextSibling?.textContent;
      } else {
        console.log('__text content is ', this.__textContent)
        return this.__textContent;
      }
    },

    set(value: string | null) {
      const slotNode = getHostSlotNode(this.childNodes, '');
      console.log('here is the slot node that I found', JSON.stringify(slotNode, null, 2));
      if (slotNode) {
        console.log('SET: value', value);
        console.log('SET: value', JSON.stringify(slotNode, null, 2));
        // this.__textContent = value;
        // this.textContent = '';
        console.log('did we get s-cr on',JSON.stringify(slotNode.textContent, null, 2))
        if (slotNode.nextSibling) {
          slotNode.nextSibling.textContent = value;
        }
        const contentRefElm: d.RenderNode = slotNode['s-cr'];
        if (contentRefElm) {
          // reset the node
          // contentRefElm.textContent = value;
          // slotNode.insertBefore(contentRefElm, slotNode.firstChild);
        }
      } else {
        console.log('SET: No this is not right. Value is', value)
        this.__textContent = value;
        const contentRefElm: d.RenderNode = this['s-cr'];
        console.log('got s-cr on',JSON.stringify(this, null, 2))
        if (contentRefElm) {
          // reset the node
          contentRefElm.textContent = '';
          this.insertBefore(contentRefElm, this.firstChild);
        }
      }
    }
  });
};

export const patchChildSlotNodes = (elm: any, cmpMeta: d.ComponentRuntimeMeta) => {
  class FakeNodeList extends Array {
    item(n: number) {
      return this[n];
    }
  }
  if (cmpMeta.$flags$ & CMP_FLAGS.needsShadowDomShim) {
    const childNodesFn = elm.__lookupGetter__('childNodes');

    Object.defineProperty(elm, 'children', {
      get() {
        return this.childNodes.map((n: any) => n.nodeType === 1);
      },
    });

    Object.defineProperty(elm, 'childElementCount', {
      get() {
        return elm.children.length;
      },
    });

    Object.defineProperty(elm, 'childNodes', {
      get() {
        const childNodes = childNodesFn.call(this);
        if (
          (plt.$flags$ & PLATFORM_FLAGS.isTmpDisconnected) === 0 &&
          getHostRef(this).$flags$ & HOST_FLAGS.hasRendered
        ) {
          const result = new FakeNodeList();
          for (let i = 0; i < childNodes.length; i++) {
            const slot = childNodes[i]['s-nr'];
            if (slot) {
              result.push(slot);
            }
          }
          return result;
        }
        return FakeNodeList.from(childNodes);
      },
    });
  }
};

const getSlotName = (node: d.RenderNode) =>
  node['s-sn'] || (node.nodeType === 1 && (node as Element).getAttribute('slot')) || '';

/**
 * Recursively searches a series of child nodes for a slot with the provided name.
 * @param childNodes the nodes to search for a slot with a specific name.
 * @param slotName the name of the slot to match on.
 * @returns a reference to the slot node that matches the provided name, `null` otherwise
 */
const getHostSlotNode = (childNodes: NodeListOf<ChildNode>, slotName: string) => {
  let i = 0;
  let childNode: d.RenderNode;

  for (; i < childNodes.length; i++) {
    childNode = childNodes[i] as any;
    console.log('looking at child node ', i)
    if (childNode['s-sr'] && childNode['s-sn'] === slotName) {
      console.log('found one', childNode)
      return childNode;
    }
  console.log('recursing on ', childNode)
    childNode = getHostSlotNode(childNode.childNodes, slotName);
    if (childNode) {
      console.log('found two', childNode)
      return childNode;
    }
  }
  return null;
};

const getHostSlotChildNodes = (n: d.RenderNode, slotName: string) => {
  const childNodes: d.RenderNode[] = [n];
  while ((n = n.nextSibling as any) && (n as d.RenderNode)['s-sn'] === slotName) {
    childNodes.push(n as any);
  }
  return childNodes;
};
