/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
 var reverseList = function(head) {
    let a = null
    let b = head
    let c = null
    while (b) {
        c = b.next
        b.next = a
        a = b
        b = c
    }
    return a
}