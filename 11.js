var removeElement2 = function (nums, val) {
    let i = 0
    let j = nums.length - 1
    while (i <= j) {
        if (nums[i] === val) {
            nums.splice(i, 1)
            i--
        }
        if (nums[j] === val) {
            nums.splice(j, 1)
            j++
        }
        i++
        j--
    }
    return nums.length
}

const removeElement3 = function (nums, val) {
    const newNums = []
    let i = -1
    while (++i < nums.length) {
        if (nums[i] !== val) {
            newNums.push(nums[i])
        }
    }
    nums.length = 0
    nums.push(...newNums)
    return newNums.length
}

const removeElement = function (nums, val) {
    let validateLength = nums.length
    let nowIndex = -1
    while (++nowIndex < validateLength) {
        const nowValue = nums[nowIndex]
        if (nowValue === val) {
            // 取最后一项非排除的值进行交换
            while (validateLength > nowIndex) {
                const lastValidateValue = nums[--validateLength]
                if (lastValidateValue !== val) {
                    nums[nowIndex] = lastValidateValue
                    // nums[validateLength] = val
                    break
                }
            }
        }
    }
    return validateLength
}

removeElement([ 4, 5 ], 5)
