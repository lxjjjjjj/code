/**
 * @file 二叉树所有路径
 */

// type Tree = {
// 	value: number;
// 	left?: Tree;
// 	right?: Tree;
// }
const tree = {
	value: 1,
	left: {
		value: 2,
		right: { value: 5 }
	},
	right: { value: 3 }
};
function treePath(root) {
	const res = []
	function travserse(root, path) {
		if(!root.left && !root.right) {
		   res.push(path)
		   return
		} 
		if(root.left && !root.right){
			path += '->' + root.left.value
			travserse(root.left, path)
			return 
		}
		if(root.right && !root.left){
			path += '->' + root.right.value
			travserse(root.right, path)
			return 
		}
		if(root.right && root.left) {
			let leftPath = path + '->' + root.left.value
			let rightPath = path + '->' + root.right.value
			travserse(root.left, leftPath)
			travserse(root.right, rightPath)
		}
	}
	travserse(root, root.value)
	return res
}
console.log(treePath(tree)) // [ '1->2->5', '1->3' ]

