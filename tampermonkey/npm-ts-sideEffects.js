// ==UserScript==
// @name         NPM detect ESM TS sideEffects
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description
// @author       Jack Works
// @match        https://www.npmjs.com/*
// @grant        GM_xmlhttpRequest
// @require     https://unpkg.com/@holoflows/kit@0.6.0
// @connect    unpkg.com
// ==/UserScript==
Proxy.revocable = (t, h) => ({ revoke() {}, proxy: new Proxy(t, h) })

if (!localStorage.getItem('npm.ts.last')) localStorage.setItem('npm.ts.last', Date.now().toString())
const { LiveSelector, MutationObserverWatcher } = HoloflowsKit
const build = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAACuUlEQVR4Ae3bA7AdSxSF4f38Yts2Zq/Ytm0WYtu2bdu2bdu2jXNvx9acTHZluqr/LnN9xyST/UymeP8msqzKPJDXYB/O8308xw0+ztsxHVUTxiJ3ZyXCYDyE+vbhizyQo7v0kscqKHuH13Ex+oPcFtLgIZRtxJ7EqV1I4CdQXpzpicKRu+JMXhKucELdCQ85u+YE9kF5zQnwWOndR3jqFeFu4hhuI+TwjsDHw/vRndCNSG+CBwk0J/BGki+hP28JeG6fgIwkHc+yipBXWfm8IMwh2RCcfeCRI7BP/AiygAZQUJIEqy1JxnuhZAm8jeSKFQAKygHBYwPga4UgqZAb6hNCPpHroDRJxR2hPjnPrXwCd+QOcoB5UDYITh9KJ5JU2ABlj+BgvuLNJBUfhLJBcPZcrHCOpMIlqK8TOIeNV0MuANz45tX+lHP8ovmKz5BUfAzKBsHRfCickgNsgrJBcDZf8SbRh1EbBEfzoTBGDtAH6oeETA7nKzQlqazCNm4ATziTo/mKC5FUsYPZmvDYyXx4ogckuXAYSvisJsnQXhrAdWQBYdhXGNCaZONF4tdBDVlAXijNCdigOQGx4dGcwL2htCbECoCjmhMSRMVNKMifBpLfCns0J1jl2EdzAmfn+5oTrLh8UXNCgiA8jH21JhBxCj6kOYH+QlHepCvhfVYSHoDz35vAx7g1+skTHIXYXAfDsQpn39837mAnT0W7xEnpddxfmCCfIfz2DIHb6E/o7g5CdzcRDMEQDMEQDMEQDMEQ+hvCr4lba09Ag58noIv2hMSpNSfwSiKtCfyASG/CUSKtCVZbIp0Jq+lvIn0Jq+X/kSNJWB39P5JPjLBMfr4kYRn+IfnECAvwD7k/rvGt+fKPPIIEniU/X5DAk+kv0iurHvu+nz+B/iD9QkbegYc4gVb0nUwm0wsxc0F+6R1+sQAAAABJRU5ErkJggg==`
const tsSvg = `<svg style="zoom: 0.4; margin-right: 0.5em;" xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M0 32v32h64.002V-.002H0zm51.577-2.55c1.625.406 2.865 1.128 4.003 2.306.59.63 1.463 1.778 1.534 2.052.02.08-2.763 1.95-4.45 2.997-.06.04-.305-.223-.58-.63-.823-1.2-1.686-1.717-3.007-1.808-1.94-.132-3.2.884-3.18 2.58 0 .498.07.792.274 1.2.427.884 1.22 1.412 3.708 2.49 4.582 1.97 6.542 3.27 7.76 5.12 1.36 2.062 1.666 5.354.742 7.802-1.016 2.662-3.535 4.47-7.08 5.07-1.097.193-3.698.163-4.876-.05-2.57-.457-5.008-1.727-6.512-3.393-.59-.65-1.737-2.347-1.666-2.47.03-.04.295-.203.59-.376l2.377-1.37 1.84-1.067.386.57c.538.823 1.717 1.95 2.428 2.326 2.042 1.077 4.846.924 6.227-.315.59-.538.833-1.097.833-1.92 0-.742-.09-1.067-.477-1.625-.498-.71-1.514-1.31-4.4-2.56-3.302-1.422-4.724-2.306-6.024-3.708-.752-.813-1.463-2.113-1.758-3.2-.244-.904-.305-3.17-.112-4.084.68-3.2 3.088-5.415 6.563-6.075 1.128-.213 3.75-.132 4.856.142zM36.552 32.12l.02 2.62h-8.33v23.67H22.35v-23.67h-8.33v-2.57l.07-2.64c.03-.04 5.1-.06 11.246-.05l11.185.03z" fill="#007acc"/></svg>`
const map = {
    '@types': packageName => `<a
        style="color: unset"
        href="https://www.npmjs.com/package/@types/${packageName}"
        target="_blank">${tsSvg}@types/
    </a>`,
    ts: () => tsSvg + '.d.ts',
    esm: () => 'import "..."',
    pure: () => `
        <span style="
            transform: scale(2) translate(0px, -4px);
            display: inline-block;
            margin-right: 2px;
        ">ƒ</span>
        No sideEffects
    `,
    gyp: () => `<img src="${build}" width="24px" height="24px" />node-gyp`
}
const watch = new MutationObserverWatcher(new LiveSelector().querySelectorAll('a[href^="/package"]'))
    .useForeach((c, _, m) => {
        let packageName = c.innerText
        const css = `margin-left: 1em;
        background: #efe7fc;
        padding: 3px 8px;
        border-radius: 6px;
        letter-spacing: 0.4px;`
        if (packageName.startsWith('@')) packageName = packageName.replace('@', '').replace('/', '__')
        function resolve(type) {
            localStorage.setItem(`npm.ts/${packageName}`, type.join(','))
            m.after.innerHTML = type.map(t => `<span style="${css}">${map[t](packageName)}</span>`).join('')
        }
        async function getPackage() {
            const cache = localStorage.getItem(`npm.ts/${packageName}`)
            if (cache) {
                const last = localStorage.getItem('npm.ts.last') || '0'
                if (Math.abs(parseInt(last) - Date.now()) / 100000 / 24 / 31 > 30) {
                    console.log('clear cache')
                    resolve(cache.split(','))
                    localStorage.clear()
                    localStorage.setItem('npm.ts.last', Date.now().toString())
                }
                return resolve(cache.split(','))
            }
            const type = []
            const types = await fetch(`https://www.npmjs.com/package/@types/${packageName}`)
            if (types.ok) type.push('@types')
            console.log('fetching ', `https://unpkg.com/${m.current.innerText}/package.json`)
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://unpkg.com/${m.current.innerText}/package.json`,
                responseType: 'json',
                anonymous: true,
                onload({ response }) {
                    if (!response) return resolve(type)
                    if ('jsnext:main' in response || 'module' in response) type.push('esm')
                    if ('typings' in response) type.push('ts')
                    if ('types' in response) type.push('ts')
                    if ('sideEffects' in response && response.sideEffects === false) type.push('pure')
                    if ('gypfile' in response) type.push('gyp')
                    resolve(type)
                }
            })
        }
        getPackage()
    })
.startWatch({childList:true, subtree: true, characterData: true})
