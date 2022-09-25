/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
 var maxDepth = function(root) {
    let res = 0
    function traversal (root, depth) {
        if (root) {
            if (depth > res) {
                res = depth
            }
            if (root.left) {
                traversal (root.left, depth + 1)
            }
            if (root.right) {
                traversal (root.right, depth + 1)
            }
        }
    }
    traversal(root, 1)
    return res
};

// 二叉树的性质：
// 1.在二叉树的第 i 层上至多有  2的i-1次方  个结点(i>=1)。
// 2.深度为k的二叉树至多有  2的k次方-1  个结点，(k>=1)。
// 3.对任何一棵二叉树T，如果其终端结点数为n0，度为2的结点数为n2，则n0 = n2 + 1;
// 4.一棵深度为k且有 2的k次方-1 个结点的二叉树称为满二叉树。
// 5.深度为k的，有n个结点的二叉树，当且仅当其每一个结点都与深度为k的满二叉树中编号从1至n的结点一一对应时，称之为完全二叉树。
// 完全二叉树的两个特性：
// 具有n个结点的完全二叉树的深度为Math.floor(log2N()+1);
// 如果对一棵有n个结点的完全二叉树（其深度为）的结点按层序编号（从第1层到第，每层从左到右），则对任一结点（1<=i<=n）有：
// 如果i=1，则结点i是二叉树的根，无双亲；如果i>1，则其双亲parent(i)是结点Math.floor(i/2)。
// 如果2i > n，则结点i无左孩子（结点i为叶子结点）；否则其左孩子LChild(i)是结点2i.
// 如果2i + 1 > n，则结点i无右孩子；否则其右孩子RChild(i)是结点2i + 1;
