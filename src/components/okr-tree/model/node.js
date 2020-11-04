import { markNodeData, NODE_KEY } from './util';
import objectAssign from './merge';

const getPropertyFromData = function(node, prop) {
  const props = node.store.props;
  const data = node.data || {};
  const config = props[prop];

  if (typeof config === 'function') {
    return config(data, node);
  } else if (typeof config === 'string') {
    return data[config];
  } else if (typeof config === 'undefined') {
    const dataProp = data[prop];
    return dataProp === undefined ? '' : dataProp;
  }
};

let nodeIdSeed = 0;

export default class Node {
  constructor(options) {
    this.id = nodeIdSeed++;
    this.data = null;
    this.expanded = false;
    this.leftExpanded = false;
    this.isCurrent = false;
    this.parent = null;

    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        console.log(name)
        console.log(options[name])
        this[name] = options[name];
      }
    }
    this.level = 0;
    this.childNodes = [];
    this.leftChildNodes = [];

    if (this.parent) {
      this.level = this.parent.level + 1;
    }

    const store = this.store;
    if (!store) {
      throw new Error('[Node]store is required!');
    }
    store.registerNode(this);
    if (this.data) {
      console.log('第一次第一次第一次第一次第一次第一次第一次第一次第一次第一次第一次第一次第一次第一次第一次')
      console.log(this.data)
      this.setData(this.data)
      if (store.defaultExpandAll || !store.showCollapsable) {
        this.expanded = true;
        this.leftExpanded = true;
      }
    }
  
    if (!Array.isArray(this.data)) {
      markNodeData(this, this.data);
    }
    if (!this.data) return;
    const defaultExpandedKeys = store.defaultExpandedKeys;
    const key = store.key;
    if (key && defaultExpandedKeys && defaultExpandedKeys.indexOf(this.key) !== -1) {
      this.expand('', null, true)
      if (this.hasLeftChild()) {
        this.expand('left', null, true)
      }
    }
    
    if (key && store.currentNodeKey !== undefined && this.key === store.currentNodeKey) {
      store.currentNode = this;
      store.currentNode.isCurrent = true;
    }

    this.updateLeafState();
  }

  setData(data) {
    if (!Array.isArray(data)) {
      markNodeData(this, data);
    }
    const store = this.store;
    this.data = data;
    this.childNodes = [];
    this.leftChildNodes = [];

    let children;
    let leftChildren;

    if (this.level === 0 && this.data instanceof Array) {
      children = this.data
      if (this.hasLeftChild) {
        leftChildren = this.data
      }
    } else {
      children = getPropertyFromData(this, 'children') || [];
      if (this.hasLeftChild) {
        leftChildren = getPropertyFromData(this, 'leftChildren') || []
      }
    }
    console.log('第二次第二次第二次第二次第二次第二次第二次第二次第二次第二次')
    console.log(children)
    console.log(this.level)
    console.log('第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次第三次')
    console.log(leftChildren)
    for (let i = 0, j = children.length; i < j; i++) {
      this.insertChild('', { data: children[i] });
    }
    if (this.hasLeftChild()) {
      for (let i = 0, j = leftChildren.length; i < j; i++) {
        this.insertChild('left', { data: leftChildren[i] });
      }
    }
  }
  get key() {
    const nodeKey = this.store.key;
    if (this.data) return this.data[nodeKey];
    return null;
  }
  get label() {
    return getPropertyFromData(this, 'label');
  }
  // 是否是 OKR 飞书模式
  hasLeftChild () {
    const store = this.store
    return store.onlyBothTree && store.direction === 'horizontal'
  }
  insertChild(isLeftChild,child, index, batch) {
    isLeftChild = isLeftChild === 'left'
    console.log('第4次第4次第4次第4次第4次第4次第4次第4次第4次第4次第4次第4次第4次第4次第4次')
    console.log(child)
    if (!child) throw new Error('insertChild error: child is required.');
    if (!(child instanceof Node)) {
      if (!batch) {
        const children = this.getChildren(isLeftChild, true);
        console.log('第5次第5次第5次第5次第5次第5次第5次第5次第5次第5次第5次第5次第5次第5次')
        console.log(children)
        console.log(children.indexOf(child.data))
        if (isLeftChild) {
          console.log('9999999999999999999999')
          console.log(children)
        }

        if (children.indexOf(child.data) === -1) {
          if (typeof index === 'undefined' || index < 0) {
            children.push(child.data);
          } else {
            children.splice(index, 0, child.data)
          }
        }
      }
      objectAssign(child, {
        parent: this,
        store: this.store
      });
      child = new Node(child);
    }

    child.level = this.level + 1;
    if (typeof index === 'undefined' || index < 0) {
      isLeftChild ? this.leftChildNodes.push(child) : this.childNodes.push(child)
    } else {
      isLeftChild ? this.leftChildNodes.splice(index, 0, child) : this.childNodes.splice(index, 0, child)
    }

    this.updateLeafState();
  }
  getChildren(isLeftChild, forceInit = false) { // this is data
    isLeftChild = isLeftChild === 'left'
    if (this.level === 0) return this.data;
    const data = this.data;
    if (!data) return null;

    const props = this.store.props;
    let children = ''
    children = isLeftChild ? 'leftChildren' : 'children'
    if (props) {
      if (isLeftChild) {
        children = props.children || 'leftChildren'
      } else {
        children = props.children || 'children'
      }
    }

    if (data[children] === undefined) {
      data[children] = null;
    }

    if (forceInit && !data[children]) {
      data[children] = [];
    }

    return data[children];
  }
  updateLeafState() {
    if (this.store.lazy === true && this.loaded !== true && typeof this.isLeafByUser !== 'undefined') {
      this.isLeaf = this.isLeafByUser;
      return;
    }
    const childNodes = this.childNodes;
    if (!this.store.lazy || (this.store.lazy === true && this.loaded === true)) {
      this.isLeaf = !childNodes || childNodes.length === 0;
      return;
    }
    this.isLeaf = false;
  }
  updateLeftLeafState() {
    if (this.store.lazy === true && this.loaded !== true && typeof this.isLeafByUser !== 'undefined') {
      this.isLeaf = this.isLeafByUser;
      return;
    }
    const childNodes = this.leftChildNodes;
    if (!this.store.lazy || (this.store.lazy === true && this.loaded === true)) {
      this.isLeaf = !childNodes || childNodes.length === 0;
      return;
    }
    this.isLeaf = false;
  }
  // 节点的收起
  collapse (isLeftChild) {
    isLeftChild === 'left' ? this.leftExpanded = false : this.expanded = false;
    console.log('3333333333333333333333')
    console.log(isLeftChild)
    console.log(this.leftExpanded)
  }
  // 节点的展开
  expand (isLeftChild, callback, expandParent) {
    isLeftChild = isLeftChild === 'left'
    const done = () => {
      if (expandParent) {
        let parent = this.parent;
        while (parent.level > 0) {
          isLeftChild ? parent.leftExpanded = true : parent.expanded = true
          parent = parent.parent;
        }
      }
      isLeftChild ? this.leftExpanded = true : this.expanded = true
      if (callback) callback();
    };
    done()
  }
}