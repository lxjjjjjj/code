/**
 * 找到和为某一值的路径
 * @param {object} node - 二叉树
 * @param {number} num - 和（目标值）
 * @param {array} stack - 栈
 * @param {number} sum - 当前路径的和
 * @param {array} result - 存储所有的结果
 * */
 function findPath(node, num, stack = [], sum = 0, result = []) {
    stack.push(node.data);
    sum += node.data;
  
    // 找到所有的节点路径(包含叶子节点和子节点的所有情况之和)
    if (sum === num) {
      // if (!node.left && !node.right && sum === num) {  // 找到所有的叶子节点路径
      result.push(stack.slice());
    }
    if (node.left) {
      findPath(node.left, num, stack, sum, result);
    }
    if (node.right) {
      findPath(node.right, num, stack, sum, result);
    }
    // 回溯算法：不符合要求，退回来，换一条路再试
    // 叶子节点直接pop；子节点中的所有的节点递归完成后再pop
    stack.pop();
    return result;
  }
  
  // t 为上文创建的二叉树
  console.log(findPath(t.root, 11)); // [5, 3, 2, 1], [5, 6]