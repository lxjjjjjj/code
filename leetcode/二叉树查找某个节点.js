// 查找一个节点
function findNode(data, node) {
    if (node) {
      if (data === node.data) {
        return node;
      } else if (data < node.data) {
        return this.findNode(data, node.left);
      } else {
        return this.findNode(data, node.right);
      }
    } else {
      return null;
    }
  }
  
  // 查找值为6的节点
  // t 为上文创建的二叉树
  console.log(findNode(6, t.root));