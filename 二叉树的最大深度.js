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