const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const orientalMindoroLocations = [
    { name: "Guinobatan", municipality: "Calapan City", lat: 13.4111, lon: 121.1802 },
    { name: "Lalud", municipality: "Calapan City", lat: 13.4035, lon: 121.1783 },
    { name: "San Vicente", municipality: "Calapan City", lat: 13.4140, lon: 121.1732 },
    { name: "Calero", municipality: "Calapan City", lat: 13.4125, lon: 121.1835 },
    { name: "Pachoca", municipality: "Calapan City", lat: 13.3952, lon: 121.1810 },
    { name: "Lumang Bayan", municipality: "Calapan City", lat: 13.4190, lon: 121.1765 },
    { name: "Camilmil", municipality: "Calapan City", lat: 13.4021, lon: 121.1823 },
    { name: "Balingayan", municipality: "Calapan City", lat: 13.4350, lon: 121.1620 },
    { name: "Wawa", municipality: "Calapan City", lat: 13.4250, lon: 121.1920 },

    { name: "Poblacion", municipality: "Puerto Galera", lat: 13.5186, lon: 120.9547 },
    { name: "Sabang", municipality: "Puerto Galera", lat: 13.5228, lon: 120.9750 },
    { name: "San Isidro", municipality: "Puerto Galera", lat: 13.4925, lon: 120.9650 },
    { name: "Tabinay", municipality: "Puerto Galera", lat: 13.4880, lon: 121.0110 },

    { name: "Poblacion", municipality: "San Teodoro", lat: 13.4390, lon: 120.9995 },
    { name: "Calsapa", municipality: "San Teodoro", lat: 13.4450, lon: 120.9900 },


    { name: "Pamiguan", municipality: "Baco", lat: 13.3720, lon: 121.1250 },
    { name: "Poblacion", municipality: "Baco", lat: 13.3505, lon: 121.1150 },

    { name: "Poblacion I", municipality: "Naujan", lat: 13.3150, lon: 121.3030 },
    { name: "Melgar A", municipality: "Naujan", lat: 13.2500, lon: 121.3500 },
    { name: "Apitong", municipality: "Naujan", lat: 13.3300, lon: 121.2800 },

    { name: "Poblacion", municipality: "Victoria", lat: 13.1740, lon: 121.2880 },
    { name: "Macatoc", municipality: "Victoria", lat: 13.1900, lon: 121.2600 },

    { name: "Poblacion", municipality: "Socorro", lat: 13.0610, lon: 121.4110 },
    { name: "Batong Dalig", municipality: "Socorro", lat: 13.0800, lon: 121.3900 },

    { name: "Poblacion", municipality: "Pola", lat: 13.1430, lon: 121.4370 },
    { name: "Buhay na Tubig", municipality: "Pola", lat: 13.1200, lon: 121.4200 },

    { name: "Poblacion", municipality: "Pinamalayan", lat: 13.3590, lon: 121.4440 },
    { name: "Wawa", municipality: "Pinamalayan", lat: 13.3650, lon: 121.4550 },

    { name: "Poblacion", municipality: "Gloria", lat: 12.9880, lon: 121.4720 },
    { name: "Agos", municipality: "Gloria", lat: 13.0100, lon: 121.4600 },

    { name: "Poblacion", municipality: "Bansud", lat: 12.8640, lon: 121.4420 },
    { name: "Proper Bansud", municipality: "Bansud", lat: 12.8600, lon: 121.4350 },

    { name: "Poblacion", municipality: "Bongabong", lat: 12.7530, lon: 121.4470 },
    { name: "Labonan", municipality: "Bongabong", lat: 12.7700, lon: 121.4100 },

    { name: "Poblacion", municipality: "Roxas", lat: 12.5910, lon: 121.4160 },
    { name: "Dangay", municipality: "Roxas", lat: 12.6100, lon: 121.4000 },

    { name: "Poblacion", municipality: "Mansalay", lat: 12.4430, lon: 121.4390 },
    { name: "Roma", municipality: "Mansalay", lat: 12.4600, lon: 121.4200 },

    { name: "Poblacion", municipality: "Bulalacao", lat: 12.3330, lon: 121.3500 },
    { name: "San Pedro", municipality: "Bulalacao", lat: 12.3200, lon: 121.3400 }
];

app.get('/api/weather', async (req, res) => {
    const cityName = req.query.city || "Calapan";
    const found = orientalMindoroLocations.find(l => 
        l.name.toLowerCase().includes(cityName.toLowerCase()) || 
        l.municipality.toLowerCase().includes(cityName.toLowerCase())
    );
    
    const lat = found ? found.lat : 13.4111;
    const lon = found ? found.lon : 121.1802;
    const name = found ? found.name : cityName;
    const municipality = found ? found.municipality : "Mimaropa";

    try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await wRes.json();
        res.json({
            name: name,
            municipality: municipality,
            country: "Philippines",
            current: data.current,
            daily: data.daily
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

app.get('/api/mindoro-search', async (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : "";
    const filtered = query 
        ? orientalMindoroLocations.filter(loc => 
            loc.name.toLowerCase().includes(query) || 
            loc.municipality.toLowerCase().includes(query)
        ) 
        : orientalMindoroLocations;

    try {
        const results = await Promise.all(filtered.map(async (loc) => {
            try {
                const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
                const data = await wRes.json();
                return {
                    name: loc.name,
                    municipality: loc.municipality,
                    province: "Oriental Mindoro",
                    current: data.current,
                    daily: data.daily
                };
            } catch (e) {
                return null; 
            }
        }));
        res.json(results.filter(r => r !== null));
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch Mindoro weather data" });
    }
});

app.listen(PORT, () => console.log(`AuraWeather Mindoro Backend running at http://localhost:${PORT}`));