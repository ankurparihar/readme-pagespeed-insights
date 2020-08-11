const express = require('express')
const url = require('url')
const app = express()
const fetch = require('node-fetch')
const { response } = require('express')
const port = process.env.PORT || 3000
const API_KEY = '***************************************'


app.listen(port, () => {
	console.log(`lighthouse-stats app listening at PORT ${port}`)
})

app.get('/', (req, res) => {
	// results
	let performance = -1
	let accessibility = -1
	let best_practices = -1
	let seo = -1
	let pwa = -1

	const queryObject = url.parse(req.url, true).query
	let strategy = queryObject.strategy || 'desktop'
	let categories = queryObject.categories || 31
	let theme = queryObject.theme || 'agnostic'
	let procedure = ((categories & 1) > 0) + ((categories & 2) > 0) + ((categories & 4) > 0) + ((categories & 8) > 0) + ((categories & 16) > 0)
	const pagespeedQueryURL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${queryObject.url}&key=${API_KEY}&strategy=${strategy}&`

	if (procedure === 0) {
		res.send('NA')
	}

	// performance
	if ((categories & 16) === 16) {
		fetch(pagespeedQueryURL + `category=performance`)
			.then(response => response.json())
			.then(json => {
				performance = Math.round(json.lighthouseResult.categories.performance.score * 100)
			}).catch(err => {
				// console.log(err)
			}).finally(() => {
				procedure--
				if (procedure === 0) proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme)
			})
	}

	// accessibility
	if ((categories & 8) === 8) {
		fetch(pagespeedQueryURL + `category=accessibility`)
			.then(response => response.json())
			.then(json => {
				accessibility = Math.round(json.lighthouseResult.categories.accessibility.score * 100)
			}).catch(err => {
				// console.log(err)
			}).finally(() => {
				procedure--
				if (procedure === 0) proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme)
			})
	}

	// best practices
	if ((categories & 4) === 4) {
		fetch(pagespeedQueryURL + `category=best-practices`)
			.then(response => response.json())
			.then(json => {
				best_practices = Math.round(json.lighthouseResult.categories['best-practices'].score * 100)
			}).catch(err => {
				// console.log(err)
			}).finally(() => {
				procedure--
				if (procedure === 0) proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme)
			})
	}

	// seo
	if ((categories & 2) === 2) {
		fetch(pagespeedQueryURL + `category=seo`)
			.then(response => response.json())
			.then(json => {
				seo = Math.round(json.lighthouseResult.categories.seo.score * 100)
			}).catch(err => {
				// console.log(err)
			}).finally(() => {
				procedure--
				if (procedure === 0) proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme)
			})
	}

	// pwa
	if ((categories & 1) === 1) {
		fetch(pagespeedQueryURL + `category=pwa`)
			.then(response => response.json())
			.then(json => {
				const lighthouseResult = json.lighthouseResult
				var fast_reliable = 0
				var fast_reliable_total = 0
				var installable = 0
				var installable_total = 0
				var optimized = 0
				var optimized_total = 0
				lighthouseResult.categories.pwa.auditRefs.forEach(auditRef => {
					var audit = lighthouseResult.audits[auditRef.id]
					if (audit.scoreDisplayMode === 'binary' || audit.scoreDisplayMode === 'numeric') {
						if (auditRef.group === 'pwa-fast-reliable') {
							fast_reliable_total++
							if ((audit) && (audit.score >= 0.9)) {
								fast_reliable++
							}
						}
						else if (auditRef.group === 'pwa-installable') {
							installable_total++
							if ((audit) && (audit.score >= 0.9)) {
								installable++
							}
						}
						else if (auditRef.group === 'pwa-optimized') {
							optimized_total++
							if ((audit) && (audit.score >= 0.9)) {
								optimized++
							}
						}
					}
				})
				pwa = 0
				if (fast_reliable === fast_reliable_total) pwa |= 1
				if (installable === installable_total) pwa |= 2
				if (optimized === optimized_total) pwa |= 4
			}).catch(err => {
				// console.log(err)
			}).finally(() => {
				procedure--
				if (procedure === 0) proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme)
			})
	}
})

function guageClass(score) {
	if (score >= 90) {
		return 'guage-green'
	}
	else if (score >= 50) {
		return 'guage-orange'
	}
	else if (score >= 0) {
		return 'guage-red'
	}
	return 'guage-undefined'
}

function proceed(performance, accessibility, best_practices, seo, pwa, res, categories, theme) {
	// test
	// performance = 95
	// accessibility = 100
	// best_practices = 76
	// seo = 40
	// pwa = 3
	// prepare svg and send
	let procedure = ((categories & 1) > 0) + ((categories & 2) > 0) + ((categories & 4) > 0) + ((categories & 8) > 0) + ((categories & 16) > 0)
	var offset1 = 500 - (procedure * 100)
	var offset2 = offset1 + ((categories & 16) === 16 ? 200 : 0)
	var offset3 = offset2 + ((categories & 8) === 8 ? 200 : 0)
	var offset4 = offset3 + ((categories & 4) === 4 ? 200 : 0)
	var offset5 = offset4 + ((categories & 2) === 2 ? 200 : 0)
	let svg = `
	<svg class="theme--${theme}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" width="1000" height="330">
		<style>
			.gauge-base {
				opacity: 0.1
			}

			.gauge-arc {
				fill: none;
				animation-delay: 250ms;
				stroke-linecap: round;
				transform: rotate(-90deg);
				transform-origin: 100px 60px;
				animation: load-gauge 1s ease forwards
			}

			.guage-text {
				font-size: 40px;
				font-family: monospace;
				text-align: center
			}

			.guage-red {
				color: #ff4e42;
				fill: #ff4e42;
				stroke: #ff4e42
			}
			.guage-orange {
				color: #ffa400;
				fill: #ffa400;
				stroke: #ffa400
			}
			.guage-green {
				color: #0cce6b;
				fill: #0cce6b;
				stroke: #0cce6b
			}
			.theme--agnostic .guage-undefined {
				color: #5c5c5c;
				fill: #5c5c5c;
				stroke: #5c5c5c
			}
			.theme--light .guage-undefined {
				color: #1e1e1e;
				fill: #1e1e1e;
				stroke: #1e1e1e
			}
			.theme--dark .guage-undefined {
				color: #f5f5f5;
				fill: #f5f5f5;
				stroke: #f5f5f5
			}

			.guage-title {
				stroke: none;
				font-size: 26px;
				line-height: 26px;
				font-family: Roboto, Halvetica, Arial, sans-serif
			}
			.metric.guage-title {
				font-family: 'Courier New', Courier, monospace
			}
			.theme--agnostic .guage-title {
				color: #737373;
				fill: #737373
			}
			.theme--light .guage-title {
				color: #212121;
				fill: #212121
			}
			.theme--dark .guage-title {
				color: #f5f5f5;
				fill: #f5f5f5
			}

			@keyframes load-gauge {
				from {
					stroke-dasharray: 0 352.858
				}
			}
			.lh-gauge--pwa__disc {
				fill: #e0e0e0
			}
			.lh-gauge--pwa__logo {
				position: relative;
				fill: #b0b0b0
			}
			.lh-gauge--pwa__invisible {
				display: none
			}
			.lh-gauge--pwa__visible {
				display: inline
			}
			.guage-invisible {
				display: none
			}
			.lh-gauge--pwa__logo--primary-color {
				fill: #304ffe
			}
			.theme--agnostic .lh-gauge--pwa__logo--secondary-color {
				fill: #787878
			}
			.theme--light .lh-gauge--pwa__logo--secondary-color {
				fill: #3d3d3d
			}
			.theme--dark .lh-gauge--pwa__logo--secondary-color {
				fill: #d8b6b6
			}
			.theme--light #svg_2 {
				stroke: #00000022
			}
			.theme--agnostic #svg_2 {
				stroke: #616161
			}
			.theme--light #svg_2 {
				stroke: #00000022
			}
			.theme--dark #svg_2 {
				stroke: #f5f5f566
			}
		</style>
		<svg class="guage-div guage-perf ${(categories & 16) === 16 ? guageClass(performance) : 'guage-invisible'}" viewBox="0 0 200 200" width="200" height="200" x="${offset1}" y="0">
			<circle class="gauge-base" r="56" cx="100" cy="60" stroke-width="8"></circle>
			<circle class="gauge-arc guage-arc-1" r="56" cx="100" cy="60" stroke-width="8" style="stroke-dasharray: ${performance >= 0 ? performance * 351.858 / 100 : 351.858}, 351.858;"></circle>
			<text class="guage-text" x="100px" y="60px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">${performance >= 0 ? performance : 'NA'}</text>
			<text class="guage-title" x="100px" y="160px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">Performance</text>
		</svg>
		<svg class="guage-div guage-acc ${(categories & 8) === 8 ? guageClass(accessibility) : 'guage-invisible'}" viewBox="0 0 200 200" width="200" height="200" x="${offset2}" y="0">
			<circle class="gauge-base" r="56" cx="100" cy="60" stroke-width="8"></circle>
			<circle class="gauge-arc guage-arc-2" r="56" cx="100" cy="60" stroke-width="8" style="stroke-dasharray: ${accessibility >= 0 ? accessibility * 351.858 / 100 : 351.858}, 351.858;"></circle>
			<text class="guage-text" x="100px" y="60px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">${accessibility >= 0 ? accessibility : 'NA'}</text>
			<text class="guage-title" x="100px" y="160px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">Accessibility</text>
		</svg>
		<svg class="guage-div guage-best ${(categories & 4) === 4 ? guageClass(best_practices) : 'guage-invisible'}" viewBox="0 0 200 200" width="200" height="200" x="${offset3}" y="0">
			<circle class="gauge-base" r="56" cx="100" cy="60" stroke-width="8"></circle>
			<circle class="gauge-arc guage-arc-3" r="56" cx="100" cy="60" stroke-width="8" style="stroke-dasharray: ${best_practices >= 0 ? best_practices * 351.858 / 100 : 351.858}, 351.858;"></circle>
			<text class="guage-text" x="100px" y="60px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">${best_practices >= 0 ? best_practices : 'NA'}</text>
			<text class="guage-title" x="100px" y="160px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">Best Practices</text>
		</svg>
		<svg class="guage-div guage-seo ${(categories & 2) === 2 ? guageClass(seo) : 'guage-invisible'}" viewBox="0 0 200 200" width="200" height="200" x="${offset4}" y="0">
			<circle class="gauge-base" r="56" cx="100" cy="60" stroke-width="8"></circle>
			<circle class="gauge-arc guage-arc-4" r="56" cx="100" cy="60" stroke-width="8" style="stroke-dasharray: ${seo >= 0 ? seo * 351.858 / 100 : 351.858}, 351.858;"></circle>
			<text class="guage-text" x="100px" y="60px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">${seo >= 0 ? seo : 'NA'}</text>
			<text class="guage-title" x="100px" y="160px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">SEO</text>
		</svg>
		<svg class="guage-div guage-pwa ${(categories & 1) === 1 ? '' : 'guage-invisible'}" viewBox="0 0 200 200" width="200" height="200" x="${offset5}" y="0">
			<svg viewBox="0 0 60 60" width="112" height="112" x="44" y="4">
				<defs>
					<linearGradient id="lh-gauge--pwa__check-circle__gradient-0" x1="50%" y1="0%" x2="50%" y2="100%">
						<stop stop-color="#00C852" offset="0%"></stop>
						<stop stop-color="#009688" offset="100%"></stop>
					</linearGradient>
					<linearGradient id="lh-gauge--pwa__installable__shadow-gradient-0" x1="76.056%" x2="24.111%" y1="82.995%" y2="24.735%">
						<stop stop-color="#A5D6A7" offset="0%"></stop>
						<stop stop-color="#80CBC4" offset="100%"></stop>
					</linearGradient>
					<linearGradient id="lh-gauge--pwa__fast-reliable__shadow-gradient-0" x1="76.056%" y1="82.995%" x2="25.678%" y2="26.493%">
						<stop stop-color="#64B5F6" offset="0%"></stop>
						<stop stop-color="#2979FF" offset="100%"></stop>
					</linearGradient>

					<g id="lh-gauge--pwa__fast-reliable-badge-0">
						<circle fill="#FFFFFF" cx="10" cy="10" r="10"></circle>
						<path fill="#304FFE" d="M10 3.58l5.25 2.34v3.5c0 3.23-2.24 6.26-5.25 7-3.01-.74-5.25-3.77-5.25-7v-3.5L10 3.58zm-.47 10.74l2.76-4.83.03-.07c.04-.08 0-.24-.22-.24h-1.64l.47-3.26h-.47l-2.7 4.77c-.02.01.05-.1-.04.05-.09.16-.1.31.18.31h1.63l-.47 3.27h.47z"></path>
					</g>
					<g id="lh-gauge--pwa__installable-badge-0">
						<circle fill="#FFFFFF" cx="10" cy="10" r="10"></circle>
						<path fill="#009688" d="M10 4.167A5.835 5.835 0 0 0 4.167 10 5.835 5.835 0 0 0 10 15.833 5.835 5.835 0 0 0 15.833 10 5.835 5.835 0 0 0 10 4.167zm2.917 6.416h-2.334v2.334H9.417v-2.334H7.083V9.417h2.334V7.083h1.166v2.334h2.334v1.166z"></path>
					</g>
				</defs>
				<g stroke="none" fill-rule="nonzero">
					<!-- Background and PWA logo (color by default) -->
					<circle class="lh-gauge--pwa__disc" cx="30" cy="30" r="30"></circle>
					<g class="lh-gauge--pwa__logo">
						<path ${pwa === 7 ? 'class="lh-gauge--pwa__logo--secondary-color"' : ''} d="M35.66 19.39l.7-1.75h2L37.4 15 38.6 12l3.4 9h-2.51l-.58-1.61z"></path>
						<path ${pwa === 7 ? 'class="lh-gauge--pwa__logo--primary-color"' : ''} d="M33.52 21l3.65-9h-2.42l-2.5 5.82L30.5 12h-1.86l-1.9 5.82-1.35-2.65-1.21 3.72L25.4 21h2.38l1.72-5.2 1.64 5.2z"></path>
						<path ${pwa === 7 ? 'class="lh-gauge--pwa__logo--secondary-color"' : ''} fill-rule="nonzero" d="M20.3 17.91h1.48c.45 0 .85-.05 1.2-.15l.39-1.18 1.07-3.3a2.64 2.64 0 0 0-.28-.37c-.55-.6-1.36-.91-2.42-.91H18v9h2.3V17.9zm1.96-3.84c.22.22.33.5.33.87 0 .36-.1.65-.29.87-.2.23-.59.35-1.15.35h-.86v-2.41h.87c.52 0 .89.1 1.1.32z"></path>
					</g>
					<!-- No badges. -->
					<rect class="lh-gauge--pwa__component lh-gauge--pwa__na-line ${pwa === 0 ? 'lh-gauge--pwa__visible' : 'lh-gauge--pwa__invisible'}" fill="#FFFFFF" x="20" y="32" width="20" height="4" rx="2"></rect>
					<!-- Just fast and reliable. -->
					<g class="lh-gauge--pwa__component lh-gauge--pwa__fast-reliable-badge ${pwa === 1 ? 'lh-gauge--pwa__visible' : 'lh-gauge--pwa__invisible'}" transform="translate(20, 29)">
						<path fill="url(#lh-gauge--pwa__fast-reliable__shadow-gradient-0)" d="M33.63 19.49A30 30 0 0 1 16.2 30.36L3 17.14 17.14 3l16.49 16.49z"></path>
						<use href="#lh-gauge--pwa__fast-reliable-badge-0"></use>
					</g>
					<!-- Just installable. -->
					<g class="lh-gauge--pwa__component lh-gauge--pwa__installable-badge ${pwa === 2 ? 'lh-gauge--pwa__visible' : 'lh-gauge--pwa__invisible'}" transform="translate(20, 29)">
						<path fill="url(#lh-gauge--pwa__installable__shadow-gradient-0)" d="M33.629 19.487c-4.272 5.453-10.391 9.39-17.415 10.869L3 17.142 17.142 3 33.63 19.487z"></path>
						<use href="#lh-gauge--pwa__installable-badge-0"></use>
					</g>
					<!-- Fast and reliable and installable. -->
					<g class="lh-gauge--pwa__component lh-gauge--pwa__fast-reliable-installable-badges ${pwa === 3 ? 'lh-gauge--pwa__visible' : 'lh-gauge--pwa__invisible'}">
						<g transform="translate(8, 29)">						<!-- fast and reliable -->
							<path fill="url(#lh-gauge--pwa__fast-reliable__shadow-gradient-0)" d="M16.321 30.463L3 17.143 17.142 3l22.365 22.365A29.864 29.864 0 0 1 22 31c-1.942 0-3.84-.184-5.679-.537z"></path>
							<use href="#lh-gauge--pwa__fast-reliable-badge-0"></use>
						</g>
						<g transform="translate(32, 29)">						<!-- installable -->
							<path fill="url(#lh-gauge--pwa__installable__shadow-gradient-0)" d="M25.982 11.84a30.107 30.107 0 0 1-13.08 15.203L3 17.143 17.142 3l8.84 8.84z"></path>
							<use href="#lh-gauge--pwa__installable-badge-0"></use>
						</g>
					</g>
					<!-- Full PWA. -->
					<g class="lh-gauge--pwa__component lh-gauge--pwa__check-circle ${pwa === 7 ? 'lh-gauge--pwa__visible' : 'lh-gauge--pwa__invisible'}" transform="translate(18, 28)">
						<circle fill="#FFFFFF" cx="12" cy="12" r="12"></circle>
						<path fill="url(#lh-gauge--pwa__check-circle__gradient-0)" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
					</g>
				</g>
			</svg>
			<text class="guage-title" y="160px" alignment-baseline="central" dominant-baseline="central" text-anchor="middle">
				<tspan x="100px" dy="-6px">Progressive</tspan>
				<tspan x="100px" dy="30px">Web App</tspan>
			</text>
		</svg>
		<svg width="604" height="76" x="200" y="250">
			<g>
				<rect fill="none" id="canvas_background" height="80" width="604" y="-1" x="-1"/>
				<g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid">
					<rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"/>
				</g>
			</g>
			<g>
				<rect fill-opacity="0" stroke-width="2" rx="40" id="svg_2" height="72" width="600" y="1" x="0" fill="#000000"/>
				<rect stroke="#000" rx="8" id="svg_3" height="14" width="48" y="30" x="35" stroke-opacity="null" stroke-width="0" fill="#ff4e42"/>
				<rect stroke="#000" rx="6" id="svg_4" height="14" width="48" y="30" x="220" stroke-opacity="null" stroke-width="0" fill="#ffa400"/>
				<rect stroke="#000" rx="6" id="svg_5" height="14" width="48" y="30" x="410" stroke-opacity="null" stroke-width="0" fill="#0cce6b"/>
				<text class="metric guage-title" xml:space="preserve" text-anchor="start" font-size="26" id="svg_6" y="45" x="100" stroke-opacity="null" stroke-width="0" stroke="#000">0-49</text>
				<text class="metric guage-title" xml:space="preserve" text-anchor="start" font-size="26" id="svg_7" y="45" x="280" stroke-opacity="null" stroke-width="0" stroke="#000">50-89</text>
				<text class="metric guage-title" xml:space="preserve" text-anchor="start" font-size="26" id="svg_8" y="45" x="470" stroke-opacity="null" stroke-width="0" stroke="#000">90-100</text>
			</g>
		</svg>
	</svg>`
	res.setHeader('Content-Type', 'image/svg+xml')
	res.send(svg)
	// res.send(`performance: ${performance}, accessibility: ${accessibility}, best-practices: ${best_practices}, seo: ${seo}, pwa: {fast and reliable: ${fast_reliable}/${fast_reliable_total}, installable: ${installable}/${installable_total}, optimized: ${optimized}/${optimized_total}}`)
}
