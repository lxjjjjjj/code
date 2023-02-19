
// 平衡二叉树
// 它可以是一颗空树，或者具有以下性质的二叉排序树：
// 它的左子树和右子树的高度之差(平衡因子)的绝对值不超过1且它的左子树和右子树都是一颗平衡二叉树

// 最大值：最右侧的节点
function getMax(root) {
  let max = null;
  let current = root;
  while (current !== null) {
    max = current.data;
    current = current.right;
  }
  return max;
}

// 最小值：最左侧的节点
function getMix(root) {
  let mix = null;
  let current = root;
  while (current !== null) {
    mix = current.data;
    current = current.left;
  }
  return mix;
}
console.log(getMax(t.root), "max"); // 9
console.log(getMix(t.root), "min"); // 1

