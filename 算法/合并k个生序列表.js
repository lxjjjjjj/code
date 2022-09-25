/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode[]} lists
 * @return {ListNode}
 * 递归合并链表+两两合并
 */
 var mergeKLists = function(lists) {
    if (!lists.length) return null
    function merge(l1, l2) {
        if (!l1) return l2
        if (!l2) return l1
        if (l1.val < l2.val) {
            l1.next = merge(l1.next, l2)
            return l1
        } else {
            l2.next = merge(l1, l2.next)
            return l2
        }
    }
    return lists.reduce((pre, cur) => merge(pre, cur))
}