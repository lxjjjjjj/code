function Tree(pTree) {
    if (!pTree) {
        return true;
    }
    return TreeJug(pTree.left, pTree.right);
}
 
function TreeJug(left, right) {
    if (!left && left === right) {
        return true;
    }
    if (!left || !right) {
        return false;
    }
    if (left.val !== right.val) {
        return false;
    }
    return TreeJug(left.left, right.right) && TreeJug(left.right, right.left);
}
let tree = {
    val: 1,
    left: null,
    right: null
};
console.log(Tree(tree));