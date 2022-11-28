
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

