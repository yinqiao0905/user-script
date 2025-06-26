// ==UserScript==
// @name         firefox 
// @namespace    http://tampermonkey.net/
// @version      06-26
// @description  firefox
// @author       qqm
// @match        *://*.firefox.fun/user/index.aspx
// @icon         https://www.google.com/s2/favicons?sz=64&domain=firefox.fun
// @updateURL    https://raw.githubusercontent.com/yinqiao0905/user-script/refs/heads/main/firefox.js
// @downloadURL  https://raw.githubusercontent.com/yinqiao0905/user-script/refs/heads/main/firefox.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
      const userStyle = `
        table > thead > tr > th:nth-child(1),
        table > thead > tr > th:nth-child(3),
        table > thead > tr > th:nth-child(7),
        table > thead > tr > th:nth-child(8) {
            display: none;
        }
        table > tbody > tr > td:nth-child(1),
        table > tbody > tr > td:nth-child(3),
        table > tbody > tr > td:nth-child(7),
        table > tbody > tr > td:nth-child(8) {
            display: none;
        }
`;
    function addStyle(){
        const iframeDocument = document.querySelector("iframe[src='business/gets.aspx']")?.contentDocument
        if (!iframeDocument) return
        const styleTag = iframeDocument.getElementById("firefox-style")
        if (styleTag) {
            return
        } else {
            const styleTag = iframeDocument.createElement('style');
            styleTag.id = "firefox-style"
            styleTag.textContent = userStyle;
            iframeDocument.head.appendChild(styleTag);  
        }
        
    }
    function autoAddReginCode(){
        const ad = document.querySelector("#adContainer")
        const logo = document.querySelector("#logo")
        if (logo) {
            logo.remove()
        }
        if (ad) {
            ad.remove()
        }
         const navs = document.querySelectorAll(".navbar-right > li")
         if (navs.length === 5) {
             navs[0].remove()
             navs[1].remove()
             navs[2].remove()
             navs[3].remove()
         }
          const avatar = document.querySelector(".navbar-right img")
          if (avatar) {
              avatar.remove()
          }
        const iframeDocument = document.querySelector("iframe[src='business/gets.aspx']")?.contentDocument
        if(!iframeDocument) return
        const alertContent = iframeDocument.querySelector("#alert")
        if (alertContent) {
            alertContent.style.display = "none"
        }
        const cardContent = iframeDocument.querySelectorAll(".card-body")?.[1]?.firstElementChild
        if (cardContent){
            cardContent.classList = []
            cardContent.style.display = "flex"
            cardContent.style.flexWrap = "wrap"
            cardContent.querySelectorAll(".mdi").forEach(md=>{
                md.style.display = "none"
            })
            Array.from(cardContent.children).forEach(child=>{
                child.style.width = "unset";
                child.style.marginRight = "12px"
            })
        }
        const tableTrs = iframeDocument.querySelectorAll("table tr")
        Array.from(tableTrs).forEach(tr => {
            const tds = tr.querySelectorAll("td")
            if(tds.length) {
                const country = tds?.[1]?.textContent?.trim()?.split("/").at(0)
                const phone = tds?.[3].querySelector("a")
                const phoneHref = phone.href
                if (!phoneHref.includes(country)) {
                    let phoneNumber
                    const matched = phoneHref.match(/\d+/g)
                    if (matched) {
                        phoneNumber = matched[0]
                        phone.href = `javascript:CopyPhoneNum('${country}${phoneNumber}');`
                    }
                }
            }
        })
    }
    const autoOpen = () =>{
        $("#layui-layer1 > span.layui-layer-setwin a").click()
        $("body > div.lyear-layout-web > div > aside > div > nav > ul > li:nth-child(6) > ul > li > a").click()
     }
     setInterval(()=>{
         autoAddReginCode()
         addStyle()
     },500)
     setTimeout(()=>{
         autoOpen()
     },1500)
})();