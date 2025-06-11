// ==UserScript==
// @name         豪猪
// @namespace    http://tampermonkey.net/
// @version      2025-06-11_v0.1
// @description  haozhu
// @author       qqm
// @match        *://h5.haozhuma.cn/index.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=haozhuma.cn
// @updateURL    https://raw.githubusercontent.com/yinqiao0905/user-script/refs/heads/main/haozhu.js
// @downloadURL  https://raw.githubusercontent.com/yinqiao0905/user-script/refs/heads/main/haozhu.js
// @grant        none
// ==/UserScript==


function removePanel(){
    const iframeDocument = document.querySelector("iframe[src='views/duanxin/index.html']")?.contentDocument
    iframeDocument.querySelector("#layuiadmin-form-useradmin > div > div > div:nth-child(1)").remove()
    // document.querySelector("body").style.zoom = 0.7
}
window.onload = removePanel
function autoAddReginCode(){
    Array.from(document.querySelector("iframe[src='views/duanxin/index.html']")?.contentDocument?.querySelectorAll('[id^="phone"]')).forEach(item=>{
        const dataClip = item.dataset.clipboardText
        if (!dataClip.startsWith("+86")){
            item.dataset.clipboardText = `+86${dataClip}`
        }
    })
}
function removeGD(){
    const iframeDocument = document.querySelector("iframe[src='views/duanxin/xmlist.html']")?.contentDocument
    if (!iframeDocument) return
    const list = iframeDocument.querySelectorAll("#tabList > tr")
    if (!list) return
    Array.from(list).forEach(item=>{
        if (item.innerText.includes('中国广电')) {
            item.remove()
        }
    })

}
setInterval(removeGD,1e3)
setInterval(autoAddReginCode,1e3)
