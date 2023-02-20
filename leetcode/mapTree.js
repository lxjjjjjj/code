/**
 * @file 树结构映射
 * 数组 map 保持数组长度相同，将对应位置元素进行映射。
 * 与之类似，在二叉树 Tree 上的映射我们称为 mapTree，该函数返回一个结构相同的新树，对应位置 value 字段经过 fn 映射。
 */


 type Tree = {
	value: number;
	left?: Tree;
	right?: Tree;
}

function mapTree(tree: Tree, fn: (v: number) => number): Tree {
	const newTree = {}
	function travserse(root) {
		if (root) {
			newTree.push()
		}
	}
}

// 测试
const tree: Tree = {
	value: 1,
	left: { value: 2 },
	right: { value: 3 }
};
console.log(mapTree(tree, v => v * 2)) // { value: 2, left: { value: 4 }, right: { value: 6 } }

export default {};