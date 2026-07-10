const lat = 40.7128
const lon = -74.0060

const updatedText = document.getElementById('updated')
const content = document.getElementById('main')

const aqiNumber = document.getElementById('aqi-number')
const aqiCategory = document.getElementById('aqi-category')
const aqiVerdict = document.getElementById('aqi-verdict')
const grid = document.getElementById('grid')

const aqiBands = [
    { max: 50, label: 'Good', bg: '#0a1f18', accent: '#34d399', verdict: 'Air quality is clean. A great day to be outside.' },
    { max: 100, label: 'Moderate', bg: '#1f1c0a', accent: '#fbbf24', verdict: 'Acceptable for most. Sensitive people might want to take it easy outdoors.' },
    { max: 150, label: 'Unhealthy for Sensitive Groups', bg: '#241608', accent: '#fb923c', verdict: 'People with asthma, heart or lung problems, kids and older adults should limit time outside.' },
    { max: 200, label: 'Unhealthy', bg: '#240d0d', accent: '#f87171', verdict: 'Everyone might start to feel it. Sensitive groups should avoid being outside too much.' },
    { max: 300, label: 'Very Unhealthy', bg: '#1e0a1e', accent: '#e879f9', verdict: 'Health alert. Everyone should avoid being outside if they can.' },
    { max: 10000, label: 'Hazardous', bg: '#210711', accent: '#fb7185', verdict: 'Emergency conditions. Stay inside and keep the windows closed.' }
]

function bandFor(aqi) {
    for (let i = 0; i < aqiBands.length; i++) {
        if (aqi <= aqiBands[i].max) {
            return aqiBands[i]
        }
    }
}

const pollutants = [
    { key: 'pm2_5', label: 'PM2.5' },
    { key: 'ozone', label: 'Ozone' },
    { key: 'carbon_monoxide', label: 'CO' }
]

const api = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide&hourly=us_aqi&past_hours=24&forecast_hours=1&timezone=America%2FNew_York`

async function load() {
    try {
        const res = await fetch(api)
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const data = await res.json()
        render(data)
    } catch (err) {
        content.innerHTML = `<div class="error">Could not load data: ${err.message}.<br>Check your connection and refresh.</div>`
    }
}

function render(data) {
    const cur = data.current
    const aqi = Math.round(cur.us_aqi)
    const band = bandFor(aqi)

    document.body.style.background = band.bg
    content.style.setProperty('--accent', band.accent)

    const t = new Date(cur.time)
    updatedText.innerText = `Updated ${t.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}`

    aqiNumber.innerText = aqi
    aqiCategory.innerText = band.label
    aqiVerdict.innerText = band.verdict

    let cells = ''
    pollutants.forEach(p => {
        let value = cur[p.key]
        if (value == null) {
            value = '—'
        } else {
            value = Math.round(value * 10) / 10
        }
        cells += `
            <div class="cell">
                <div class="cell-label">${p.label}</div>
                <div class="cell-value">${value} <span class="cell-unit">µg/m³</span></div>
            </div>`
    })
    grid.innerHTML = cells

    drawChart(data.hourly, band.accent)
}

function drawChart(hourly, color) {
    const labels = []
    hourly.time.forEach(ts => {
        const label = new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric' })
        labels.push(label)
    })

    const ctx = document.getElementById('trend')

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'US AQI',
                data: hourly.us_aqi,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    ticks: { color: '#93a4b3' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#93a4b3', maxTicksLimit: 8 }
                }
            }
        }
    })
}

load()