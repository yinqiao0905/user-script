// ==UserScript==
// @name         firefox
// @namespace    http://tampermonkey.net/
// @version      07.11.02
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
            try {
                iframeDocument.head.appendChild(styleTag);
            } catch (error) {
                console.log(error)
            }
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

     const autoCloseDialog = () =>{
        const currentIframe = document.querySelector("iframe.active")?.contentDocument
        if (!currentIframe) return
        const close = currentIframe.querySelector(".layui-layer-dialog > span.layui-layer-setwin > a")
        const buttonText = currentIframe.querySelector(".layui-layer-dialog .layui-layer-btn")?.innerText
        if (!close) return
        if (buttonText.includes("取消") || buttonText.toLowerCase().includes("no")) return
        close.click()
     }
     const setPageSize = () =>{
        const currentIframe = document.querySelector("iframe.active")?.contentDocument
        const pageSizeSelect =  currentIframe.querySelector("#selPageSize")
        if (pageSizeSelect) {
            pageSizeSelect.value = '100'
        }
     }

     const quickSetCountry = (value,text) =>{
        const iframeDocument = document.querySelector("iframe[src='business/gets.aspx']")?.contentDocument
        if(!iframeDocument) return
        const countrySelect = iframeDocument.querySelector("#Txt_Country_ID")
        if (countrySelect) {
            countrySelect.value = value
            iframeDocument.querySelector("#select2-Txt_Country_ID-container").textContent = text
        }
        try {
            iframeDocument.querySelector("#btn_Get")?.click()
        } catch (error) {
            console.log(error)
        }
     }
     const addCustomButton = () =>{
        const iframeDocument = document.querySelector("iframe[src='business/gets.aspx']")?.contentDocument
        if(!iframeDocument) return
        const buttons = $(iframeDocument.querySelector("body > div.container-fluid > div > div > div:nth-child(2) > div > div")).children()
        if (buttons.length !== 4) return
        const newButtons = [
            {text:"智利",value:"chl",code: 56},
            {text:"哥伦比亚",value:"col",code: 57},
            {text:"马来西亚",value:"mys",code: 60},
            {text:"印尼",value:"idn",code: 62},
            {text:"菲律宾",value:"phl",code: 63},
            {text:"越南",value:"vnm",code: 84},
            {text:"香港",value:"hkg",code: 852},
            {text:"澳门",value:"mac",code: 853},
        ]
        newButtons.forEach(button=>{
            const div = document.createElement("div")
            div.classList = "col-12 mb-1"
            div.style.marginRight = "12px"
            const buttonElement = document.createElement("button")
            buttonElement.classList = "btn btn-info"
            buttonElement.textContent = button.text
            buttonElement.value = button.value
            buttonElement.addEventListener("click",()=>{
                quickSetCountry(button.value,`${button.text}+${button.code}`)
            })
            div.appendChild(buttonElement)
            buttons.eq(0).after(div)
        })
     }
     setInterval(()=>{
         autoAddReginCode()
         addStyle()
         autoCloseDialog()
         setPageSize()
         addCustomButton()
     },200)
     setTimeout(()=>{
         autoOpen()
     },1500)
})();