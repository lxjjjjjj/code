/**
 * 3.将48位的时间位图格式化成字符串
 * 将一天24小时按每半小划分成48段，我们用一个位图表示选中的时间区间，例如`110000000000000000000000000000000000000000000000`，
表示第一个半小时和第二个半小时被选中了，其余时间段都没有被选中，也就是对应00:00~01:00这个时间区间。一个位图中可能有多个不连续的
时间区间被选中，例如`110010000000000000000000000000000000000000000000`，表示00:00-1:00和02:00-02:30这两个时间区间被选中了
示例输入：`"110010000000000000000000000000000000000000000000"`
示例输出：`["00:00~01:00", "02:00~02:30"]`
 *
 * @export
 * @param {string} bitmap 时间位图，110001010101001010000011110000111111111111111111
 * @return {Array<object>} 时间区间数组
 */
function timeBitmapToRanges(bitmap) {
    let start = 0, sum = 0
    const res = []
    for(let i = 0; i < bitmap.length; i++) {
        if(bitmap[i] === '1') {
            if(!start) start = i
            sum += 30
        } else {
            const startHour = Math.floor(start / 2) > 10 ? `${Math.floor(start / 2)}` : `0${Math.floor(start / 2)}`
            const startMinut = (start % 2) ? `00` : '30'
            const hourBit = startMinut === '00' ? Math.floor(sum / 60) + startHour : Math.floor(sum / 60) + startHour + 0.5
            const realhourBit =  hourBit > 10 ? `${Math.floor(sum / 60) + startHour}` : `0${Math.floor(sum / 60) + startHour}`
            const realminutBit = hourBit % 60 ? `30` : `00`
            res.push(`${startHour}:${startMinut}~${hourBit}:${minutBit}`)
            start = 0
            sum = 0
        }
    }
    return res
}

// console.log(timeBitmapToRanges("110010000000000000000000000000000000000000000000"));
// ['00:00~01:00', '02:00~02:30']
// console.log(timeBitmapToRanges("111111111111111111111111111111111111111111111111"));
// [ '00:00~24:00' ]

// console.log(timeBitmapToRanges("110010000000000000000011100000000001000001000000"));
// [ '00:00~01:00',
//   '02:00~02:30',
//   '11:00~12:30',
//   '17:30~18:00',
//   '20:30~21:00' ]

// console.log(timeBitmapToRanges("101110000000111110000011100000000001101111000000"));
// [ '00:00~00:30',
//   '01:00~02:30',
//   '06:00~08:30',
//   '11:00~12:30',
//   '17:30~18:30',
//   '19:00~21:00' ]


