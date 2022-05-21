// ==UserScript==
// @name         Stamp checklist
// @namespace    github.com/windupbird144
// @version      0.3
// @description  neopetsclassic.com fill empty
// @author       github.com/windupbird144
// @match        https://neopetsclassic.com/stamps/album/?page_id=*&owner=*
// @icon         https://neopetsclassic.com/images/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==
/*
(function() {
function stampFromImage(img) {
    if (img.src.endsWith("no_stamp.gif")) return
    const url = img.src.replace("https://neopetsclassic.com","")
    const [name, rest] = img.title.split(" - r")
    const [stringRarity, description] = rest.split(" : ")
    const rarity = parseInt(stringRarity)
    return [name, rarity, description, url]
}
const pageId = +new URLSearchParams(window.location.search).get("page_id")
const stamps = Array.from(document.querySelectorAll(`table[width="450"] img`))
    .map(stampFromImage)

    const ser = JSON.stringify(stamps)
    return ser
})()

*/
(function () {
    'use strict';

    // Your code here...
    // Fetch the database of stamps remotely. We expect the host of the external resource to manage
    // the E-Tag header, use no-cache to only reload the resource if it has been update.
    fetch("https://raw.githubusercontent.com/windupbird144/npc-stamp-album-helper/main/stamps.json", { cache: "no-cache" })
        .then(res => res.json())
        .then(main)

    function main(database) {

        const table = document.querySelector(`table[width="450"]`)
        const cells = table.querySelectorAll("td img")

        // Double click for a shop wizard searchg
        table.addEventListener('dblclick', e => {
            // Any element with 'name' in its dataset is considered shop wizard searchable
            const name = e.target?.dataset?.name
            if (name) {
                // A stamp was clicked
                e.stopPropagation()
                e.preventDefault()
                // Open the shop wizard in a new tab
                searchWizard(name)
            }
        })

        table.addEventListener('click', e => {
            const slot = e?.target?.dataset?.position
            if (typeof slot === "string") {
                updateInfo(+slot)
            }
        })


        // The url stores a query parameter page_id=? which indicates the current album
        const page = +new URLSearchParams(window.location.search).get("page_id")

        // Update the album slots
        for (let slot = 0; slot < cells.length; slot++) {
            // This identifies if we have a stamp, wheteher it is collected and a database entry
            const cell = cells[slot]
            const collected = cell.title
            const databaseEntry = database[page] ? database[page][slot] : undefined
            // Update the dataset for the shop wizard functionality
            if (databaseEntry) {
                cell.dataset.position = slot
                cell.dataset.name = databaseEntry[0]
                cell.dataset.rarity = databaseEntry[1]
                cell.dataset.description = databaseEntry[2]
                cell.dataset.collected = !!collected
            }
            // Uncollected stamp fill the slot with database info
            if (databaseEntry && !collected) {
                cell.src = databaseEntry[3]
                cell.title = `${databaseEntry[0]} - r${databaseEntry[1]} : ${databaseEntry[2]}`
                cell.style.opacity = 0.25
            }
        }




        function searcher(url, value, select) {
            return function (query) {
                const w = window.open(url)
                w.addEventListener("DOMContentLoaded", (e) => {
                    // Fill the shop wizard form with the name of the stamp and set it to
                    // identical search
                    const IDENTICAL_TO_MY_PHRASE = value
                    const searchMethod = w.document.querySelector(`select[name='${select}']`)
                    const queryInput = w.document.querySelector("input[name='query']")
                    if (searchMethod && queryInput) {
                        searchMethod.value = IDENTICAL_TO_MY_PHRASE
                        queryInput.value = query
                    }
                })
            }
        }

        function encodeQuery(key, value) {
            const tmp = new URLSearchParams()
            tmp.set(key, value)
            return tmp.toString()
        }

        const searchWizard = searcher('/market/wizard', 1, 'search_method')
        const searchTradingPost = searcher('/island/tradingpost/browse/', 2, 'category')
        const searchAuctionHouse = () => window.open("/auctions")
        const searchSDB = (query) => window.open(`/safetydeposit/?page=1&${encodeQuery("query", query)}&category=0`)
        const searchJellyneo = (query) => window.open(`https://items.jellyneo.net/search/?${encodeQuery("name", query)}`)

        // Show a rich info box at the bottom
        table.insertAdjacentHTML("beforeend", `<tbody>
    <tr>
    <td colspan="5">
      <div id="stampinfo" hidden>
        <div class="name">name</div>
        <div class="rarity"></div>
        <div class="cols">
        <div class="arrow" data-delta="-1"><</div>
        <div class="image"><img src=""/></div>
        <div class="labels">
           <div><label>Position: </label><span class="position"></span></div>
           <div><label>Status: </label><span class="status"></span></div>
           <div class="links">
             <img data-search="wizard" src="https://raw.githubusercontent.com/kreotsai/npcShopTools/main/shopwiz.gif" />
             <img data-search="trading" src="https://raw.githubusercontent.com/kreotsai/npcShopTools/main/trade_offer.png" />
             <img data-search="auction-house" src="https://i.ibb.co/vYzmPxV/auction25.gif" />
             <img data-search="sdb" src="https://i.ibb.co/gRQ24Jx/sdb25.gif" />
             <img data-search="jn" src="https://i.ibb.co/cvGsCw4/fishnegg25.gif" />
           </div>
        </div>
        <div class="arrow" data-delta="1">></div>
        </div>
      </div>
    </td>
    </tr>
    </tbody><style>
    #stampinfo {
      margin-top: 1em;
      padding: 1em;
      border: 1px solid #aaa;
    }
    #stampinfo .arrow {
       font-size: 2em;
       display: flex;
       align-items: center;
       user-select: none;
       cursor: pointer;
    }
    #stampinfo > div {
       text-align: center;
    }
    #stampinfo .labels {
       text-align: left;
       display: grid;
       row-gap: 0.5em;
    }
    #stampinfo .image {
       padding: 0 2em 0 1em;
       user-select: none;
    }
    #stampinfo label,
    #stampinfo .name {
       font-weight: bold;
    }
    .cols {
       display: grid;
       grid-template-columns: min-content auto 1fr min-content;
    }
    [data-collected="true"] { color: darkgreen }
    [data-collected="false"] { color: darkred }

    </style>`)

        const stampinfo = table.querySelector("#stampinfo")

        const infos = {
            img: stampinfo.querySelector("img"),
            name: stampinfo.querySelector(".name"),
            rarity: stampinfo.querySelector(".rarity"),
            position: stampinfo.querySelector(".position"),
            status: stampinfo.querySelector(".status")
        }

        let currentPos = 0

        function updateInfo(pos) {
            const stampImage = cells[pos]
            if (!stampImage) return
            const { src, dataset } = stampImage
            if (!dataset) return
            const { name, rarity, collected } = dataset
            if (!name) return
            infos.img.src = src
            infos.name.textContent = name
            infos.rarity.textContent = "r" + rarity
            infos.position.textContent = pos + 1
            infos.status.textContent = collected === "true" ? "collected" : "not collected"
            infos.status.dataset.collected = collected
            stampinfo.hidden = false
            currentPos = pos
            return true
            // links: ssw, sw, tp, auc, sdb, jn
        }

        stampinfo.addEventListener("click", (e) => {
            // Move left or right to the next stamp, skipping over empty slots
            let delta = parseInt(e?.target?.dataset?.delta, 10)
            if (Math.abs(delta) !== 1) return;
            let target = currentPos + delta
            while (true) {
                if (updateInfo(target)) break; // returns true if the info was updated
                if (target < 0) break;
                if (target > 25) break;
                target = target + delta
            }
        })

        stampinfo.addEventListener("click", (e) => {
            const search = e.target.dataset.search
            const query = cells[currentPos].dataset.name
            const searchFunction = {
                "wizard": searchWizard,
                "trading": searchTradingPost,
                "auction-house": searchAuctionHouse,
                "sdb": searchSDB,
                "jn": searchJellyneo
            }[search]
            if (searchFunction) {
                return searchFunction(query)
            }
        })

        const jellyneoLinks = {
            [1]: "/mystery-island-album-avatar-list/",
            [2]: "/virtupets-album-avatar-list/",
            [3]: "/tyrannia-album-avatar-list/",
            [4]: "/haunted-woods-album-avatar-list/",
            [5]: "/neopia-central-album-avatar-list/",
            [6]: "/neoquest-album-avatar-list/",
            [7]: "/snowy-valley-album-avatar-list/",
            [8]: "/meridell-vs-darigan-album-avatar-list/",
            [9]: "/lost-desert-album-avatar-list/",
            [10]: "/battledome-album-avatar-list/",
            [12]: "/battle-for-meridell-album-avatar-list/",
        }

        const jellyneoLink = jellyneoLinks[page]
        if (jellyneoLink) {
            table.nextElementSibling?.insertAdjacentHTML("afterend", `<a href="https://items.jellyneo.net/search${jellyneoLink}" target="_blank"/><center><img src="https://i.ibb.co/cvGsCw4/fishnegg25.gif" /> Album info <img src="https://i.ibb.co/cvGsCw4/fishnegg25.gif" /></center></a>`)
        }
    }
})();