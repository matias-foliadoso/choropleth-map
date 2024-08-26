Promise.all([
    fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json').then(r => r.json()),
    fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json').then(r => r.json())
]).then(([data, map]) => {

    // Dimensions.
    const width = 960
    const height = 600
    const marginRight = 100
    const marginLeft = 600

    // Horizontal minimum and maximum domain.
    const horizontalDomain = data.map(d => d.bachelorsOrHigher)
    const minHorizontalDomain = Math.min(...horizontalDomain)
    const maxHorizontalDomain = Math.max(...horizontalDomain)

    // Horizontal scale and axis.
    const horizontalScale = d3
        .scaleLinear()
        .domain([minHorizontalDomain, maxHorizontalDomain])
        .range([marginLeft, width - marginRight])

    const colorThreshold = d3
        .scaleThreshold()
        .domain(d3.range(minHorizontalDomain, maxHorizontalDomain, (maxHorizontalDomain - minHorizontalDomain) / 8))
        .range(d3.schemeGreens[9])

    const colorAxis = d3
        .axisBottom(horizontalScale)
        .tickValues(colorThreshold.domain())
        .tickFormat(x => Math.round(x) + '%')
        .tickSize(13)

    // Choropleth Map
    const svg = d3
        .select('.choropleth-map')
        .attr('viewBox', [0, 0, width, height])
        .attr('width', width)
        .attr('height', height)

    // Counties appending
    const path = d3.geoPath()

    const g = svg
        .append('g')

    const counties = g
        .selectAll('path')
        .data(topojson.feature(map, map.objects.counties).features)
        .enter()
        .append('path')
        .attr('class', 'county')
        .attr('d', path)
        .attr('fill', d => {
            const data = getDataById(d.id)
            return data ? colorThreshold(data.bachelorsOrHigher) : colorThreshold(0)
        })
        .attr('data-fips', d => d.id)
        .attr('data-education', d => {
            const data = getDataById(d.id)
            return data ? data.bachelorsOrHigher : 0
        })

    // Get data by Id
    function getDataById(id) {
        return data.filter(obj => obj.fips === id)[0]
    }

    // Legend
    const legendHeight = 8

    const legendContainer = svg
        .append('g')
        .attr('id', 'legend')
        .attr('class', 'legend')
        .attr('transform', 'translate(0, 40)')

    legendContainer
        .selectAll('rect')
        .data(
            colorThreshold.range().map(c => {
                const n = colorThreshold.invertExtent(c)
                const colorExtent = d3.extent(colorThreshold.domain())
                if (!n[0]) {
                    n[0] = colorExtent[0]
                }
                if (!n[1]) {
                    n[1] = colorExtent[1]
                }
                return n
            })
        )
        .enter()
        .append('rect')
        .attr('class', 'legend-rect')
        .attr('fill', d => colorThreshold(d[0]))
        .attr('x', d => horizontalScale(d[0]))
        .attr('width', d => d[0] && d[1] ? horizontalScale(d[1]) - horizontalScale(d[0]) : 0)
        .attr('height', legendHeight)

    legendContainer
        .append('g')
        .call(colorAxis)
        .select('.domain')
        .remove()

    // Tooltip hover
    counties
        .on('mouseover', (e, d) => {
            const { pageX, pageY } = e
            const {

            } = d

            const data = getDataById(d.id)
            if (data) {
                const { area_name: areaName, state, bachelorsOrHigher } = data

                tooltip
                    .attr('data-education', bachelorsOrHigher)
                    .style('opacity', 0.9)
                    .style('left', `${pageX + 10}px`)
                    .style('top', `${pageY - 28}px`)

                tooltip
                    .select('span')
                    .text(`${areaName}, ${state}: ${bachelorsOrHigher}%`)
            }
        })
        .on('mouseout', () => {
            tooltip
                .style('opacity', 0)
        })

    // Tooltip appending
    const tooltip = d3
        .select('body')
        .append('div')
        .attr('id', 'tooltip')
        .attr('class', 'tooltip')
        .attr('opacity', '0')

    tooltip
        .append('span')

    // Zoom

    const zoom = d3
        .zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed)

    function zoomed(e) {
        const { transform } = e
        g.attr("transform", transform);
    }

    svg
        .call(zoom)
})