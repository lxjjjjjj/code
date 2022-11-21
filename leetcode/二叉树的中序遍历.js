// 输入：root = [1,null,2,3]
// 输出：[1,3,2]
// 示例 2：

// 输入：root = []
// 输出：[]
// 示例 3：

// 输入：root = [1]
// 输出：[1]

var inorderTraversal = function(root) {
    var inorderTraversal = function(root,array=[]) {
        if(root){
            inorderTraversal(root.left,array);
            array.push(root.val);
            inorderTraversal(root.right,array);
        }
        return array;
    }
    return inorderTraversal(root)
};