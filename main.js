

var graph_params = {
    group: "starting_year", // What to show
    width: 880, // Width of the svg element
    height: 680, // Height of the svg element
    margin: { top: 50, right: 30, bottom: 30, left: 70 }, // Margins of the inner graph
    innerWidth: 870 - 70 - 30,
    innerHeight: 600 - 50 - 30,
    spaceBetweenBars: 7, // Spacing between two bars 
    emptySpace: 0.3 // Expressed as percentage of the width of a bar 
}

graph_draw = {}; // Object containing the drawing functions.

/* Appends a new svg element to the body, adjusting its width and its height. */
graph_draw.init = function() {
    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // move the 'group' element to the top left margin
    var svg = d3.select(".graph").append("svg")
        .attr("width", graph_params.width)
        .attr("height", graph_params.height)
    .append("g")
        .attr("transform", 
            "translate(" + graph_params.margin.left + "," + graph_params.margin.top + ")");

    /* Append the tooltip on the graph if it was not already there */
    if(d3.select(".tooltip").empty())
        d3.select("body").append("div").attr("class", "tooltip");

    /* Build and append the title for the current graph */
    build_title(svg);

    /* Append the patterns */
    var defs = svg.append('defs');
    initPatterns(defs);

    return svg;
};

/* Group and show data by starting year. */
graph_draw.byYear = function() {
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property

    d3.csv("data/" + xName + ".csv").then(data => {
        /* x-scale (linear) */
        var x = d3.scaleLinear()
            .domain(d3.extent(data, d => d[xName]))
            .range([0, graph_params.innerWidth]);

        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, d =>  +d.total)])
            .range([graph_params.innerHeight, 0])

        var stackedScale = d3.scaleLinear()
            .domain(y.domain())
            .range([0, graph_params.innerHeight]) // Inverted with respect to y

        var stackLayoutScopus = d3.stack().keys(["scopus_stg", "scopus_cog", "scopus_adg", "scopus_poc"]); // Stacked bars
        var colorScale = d3.scaleOrdinal().domain(stackLayoutScopus.keys()).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F"]) // Corresponding colors

        /* Append Total Bars */
        var g = svg.selectAll("rect.total")
        .data(data)
        .enter()
        .append("g");
        g.each(function(d) {
            d3.select(this)
                .selectAll("rect.total") 
                .data([d]) // Needs to be an array
                .enter()
                .append("rect")
                .attr("class", "total")
                .attr("width", 100)
                .attr("x", () => { return x(d[xName]) + graph_params.spaceBetweenBars})
                /* y and height set according to the enter animation */
                .attr("y", graph_params.innerHeight)
                .attr("height", 0)
                .transition().duration(1000) 
                .attr("height", () => { return graph_params.innerHeight - y(d["total"]); })
                .attr("y", y(d["total"]))
            /* Append the tooltip with additional information to the total bars */
            d3.select(this)
                .on("mousemove", () => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("Total winners starting this year: <strong>" + d["total"] + "</strong>"
                        + "<br>Scopus Coverage: <strong>" + Math.round((d["scopus_profiles"] / d["total"] * 100) * 10) / 10 + "%</strong> ("+d["scopus_profiles"]+")"
                        + "<br>Orcid Coverage: <strong>" + Math.round((d["orcid_profiles"] / d["total"] * 100) * 10) / 10 + "%</strong> ("+d["orcid_profiles"]+")");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
        })
        
        /* Append data bars for scopus */
        g = svg.selectAll("rect.scopus")
            .data(stackLayoutScopus(data))
            .enter()
            .append("g");

        g.each(function(d) {
            var r= d3.select(this).selectAll("rect") 
                .data(d)
                .enter();
                r.append("rect")
                .attr("width", 40)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(i+2014) + 5 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("fill", colorScale(d.key)) // Colors for the stacked bar
                .style("opacity", 0) // For the fadeIn animation
                .on("mousemove", p => { // Append the tooltip on each bar
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("(Scopus) " + keyYearToGrant(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)
            })

        /* Redefine the stacked scale for the Orcid bars */
        var stackLayoutOrcid = d3.stack().keys(["orcid_stg", "orcid_cog", "orcid_adg", "orcid_poc"]);
        colorScale = d3.scaleOrdinal().domain(stackLayoutOrcid.keys()).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F"])
        /* Append the orcid bars */
        g = svg.selectAll("rect.orcid")
            .data(stackLayoutOrcid(data))
            .enter()
            .append("g");
        g.each(function(d) {
            var r = d3.select(this)
                .selectAll("rect") 
                .data(d)
                .enter();
                r.append("rect")
                .attr("width", 40)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(i+2014) + 55 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("fill", colorScale(d.key)) 
                .style('opacity', 0)
                .transition().duration(1000)
                .style("opacity", 1)

                /* Add a diagonal pattern for Orcid */
                r.append("rect")
                .attr("width", 40)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(i+2014) + 55 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("opacity", 0) 
                .style('fill', 'url(#diagonalHatch)')
                .on("mousemove", p => { // Append the tooltip on this bars that are above the others
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("(Orcid) " + keyYearToGrant(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)
        })

        /* Append the x axis */
        var xAxis = d3.axisBottom(x)
            .tickValues(range(parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName]} ))))
            .tickFormat(d3.format(".0f"));

        var barWidth = d3.select("rect.total").attr("width") / 2 - 10;

        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars */
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + barWidth + ", 0)")

        /* Append the y axis */
        var yAxis = d3.axisLeft().scale(y)

        svg.append("g").call(d3.axisLeft(y))
        
        /* Append the axes labels on the whole graph */
        appendAxesLabels("Starting Year", "Number of People")
    
        /* Add the legend */
        var legend = svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left - 20)+",20)");

        var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
        .shapePadding(10)
        .title("Grant Type")
        .scale(d3.scaleOrdinal().domain(["Starting","Consolidator","Advanced","Proof of Concept"]).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F"]))

        legend.call(legendOrdinal)
    });
}

/* Group and show data by type of grant. */
graph_draw.byGrant = function() {
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property

    d3.csv("data/" + xName + ".csv").then(data => {
        /* x-scale (bands) */
        var x = d3.scaleBand()
            .range([0, graph_params.innerWidth])
            .padding(0.2).round(true)
            .domain(data.map(function(d) { return d[xName]; }))

        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, d => { return +d.total } )])
            .range([graph_params.innerHeight, 0])

        var stackedScale = d3.scaleLinear()
            .domain(y.domain())
            .range([0, graph_params.innerHeight]) // Inverted!

        /* Stacked layout for Scopus bars (and corresponding colors) */
        var stackLayoutScopus = d3.stack().keys(["scopus_2014", "scopus_2015", "scopus_2016", "scopus_2017", "scopus_2018", "scopus_2019", "scopus_2020"]);
        var colorScale = d3.scaleOrdinal().domain(stackLayoutScopus.keys()).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F", "#5eafc6", "#41a368", "#f00"])

        /* Append Total Bars */
        var g = svg.selectAll("rect.total")
        .data(data)
        .enter()
        .append("g");
        g.each(function(d) {
            d3.select(this)
                .selectAll("rect.total") 
                .data([d]) // Needs to be an array
                .enter()
                .append("rect")
                .attr("class", "total")
                .attr("width", x.bandwidth())
                .attr("x", x(d[xName]))
                .attr("height", 0)
                .attr("y", graph_params.innerHeight)
                .transition().duration(1000)
                .attr("height", () => { return graph_params.innerHeight - y(d.total); })
                .attr("y", y(d.total))

            /* Append the tooltip showing additional information */
            d3.select(this)
                .on("mousemove", () => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 100 + "px")
                        .style("display", "inline-block")
                        .html("Total winners in this group<br><strong>" + d.total + "</strong>"
                        + "<br>Scopus Coverage: <strong>" + Math.round((d["scopus_profiles"] / d["total"] * 100) * 10) / 10 + "%</strong> ("+d["scopus_profiles"]+")"
                        + "<br>Orcid Coverage: <strong>" + Math.round((d["orcid_profiles"] / d["total"] * 100) * 10) / 10 + "%</strong> ("+d["orcid_profiles"]+")");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
        })

        /* Append data bars (Scopus) */
        g = svg.selectAll("rect.scopus")
            .data(stackLayoutScopus(data))
            .enter()
            .append("g");
        g.each(function(d) {
            console.log();
            var r = d3.select(this).selectAll("rect") 
                .data(d)
                .enter();
                r.append("rect")
                .attr("width", x.bandwidth()/2.5)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(data[i][xName]) + 5 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("fill", colorScale(d.key)) 
                .style("opacity", 0)
                .on("mousemove", p => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("(Scopus) Started in " + keyGrantToYear(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)
            })

        /* Same as before but with Orcid */
        var stackLayoutOrcid = d3.stack().keys(["orcid_2014", "orcid_2015", "orcid_2016", "orcid_2017", "orcid_2018", "orcid_2019", "orcid_2020"]);
        var colorScale = d3.scaleOrdinal().domain(stackLayoutOrcid.keys()).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F", "#5eafc6", "#41a368", "#f00"])

        g = svg.selectAll("rect.orcid")
            .data(stackLayoutOrcid(data))
            .enter()
            .append("g");
        g.each(function(d) {
            var r = d3.select(this)
                .selectAll("rect") 
                .data(d)
                .enter();
                r.append("rect")
                .attr("width", x.bandwidth()/2.5)
                .attr("height", p => { console.log(d);return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(data[i][xName]) + (x.bandwidth()/2.5) + 10 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("fill", colorScale(d.key)) 
                .style("opacity", 0)
                .transition().duration(1000)
                .style("opacity", 1)

                r.append("rect")
                .attr("width", x.bandwidth()/2.5)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(data[i][xName]) + (x.bandwidth()/2.5) + 10 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("opacity", 0)
                .style('fill', 'url(#diagonalHatch)') // Use the diagonal pattern
                .on("mousemove", p => { // Append the tooltip
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("(Orcid) Started in " + keyGrantToYear(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)
        })


        // add the x Axis
        var xAxis = d3.axisBottom(x)

        svg.append("g")
             .attr("class", "x")
             .attr("transform", "translate(0," + graph_params.innerHeight + ")")
             .call(xAxis)
             .selectAll("text")
 
        // add the y Axis
        svg.append("g")
             .call(d3.axisLeft(y));

        /* Append the Axes Labels to the svg element */
        appendAxesLabels("Type of Grant", "Number of People")

        /* Add the legend */
        var legend = svg.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left)+",20)");

        var legendOrdinal = d3.legendColor()
            .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
            .shapePadding(10)
            .title("Started in")
            .scale(d3.scaleOrdinal().domain(["2014","2015","2016","2017","2018","2019","2020"]).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F", "#5eafc6", "#41a368", "#f00"]))

        legend.call(legendOrdinal)
    });
    
}

/* Group and show data by nation */
graph_draw.byNation = function() {
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property

    d3.csv("data/" + xName + ".csv").then(data => {
        /* x-scale (bands) */
        var x = d3.scaleBand()
        .range([0, graph_params.innerWidth])
        .padding(0.2).round(true)
        .domain(data.map(d => d[xName] ))

        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, 1]) // Percentage 
            .range([graph_params.innerHeight, 0])

        /*var yRight = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.total)])
            .range([graph_params.innerHeight, 0]) */

        /* Append Total Bars */
        var g = svg.selectAll("rect.total")
        .data(data)
        .enter()
        .append("g");
        g.each(function(d) {
            d3.select(this)
                .selectAll("rect.total") 
                .data([d]) // Needs to be an array
                .enter()
                .append("rect")
                .attr("class", "total")
                .attr("width", x.bandwidth())
                .attr("height", 0)
                .attr("x", () => { return  x(d[xName])}) //+ graph_params.spaceBetweenBars})
                .attr("y", graph_params.innerHeight)
                .on("mousemove", () => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("Total winners in "+d[xName]+"<br><strong>" + d.total + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .attr("height", () => { return graph_params.innerHeight - y(/*+d.total*/1); })
                .attr("y", y(1))
                
        })

        /* Append data bars (Scopus) */
                // append the bar rectangles to the svg element
        var mean = d3.mean(data, d => +d.total)
        var max = d3.max(data, d => +d.total)
        g = svg.selectAll("rect.scopus")
            .data(data)
            .enter()
            .append("g");

        /* Scopus */
        g.append("rect")
            .attr("class", "")
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => graph_params.innerHeight - y(d.scopus_profiles / d.total))
            .attr("x", d => x(d[xName]))
            .attr("y", d => y(d.scopus_profiles / d.total))
            .attr("fill", d => "url(#"+linearGradient(d, max)+")") 
            .style("opacity", 0)
            .on("mousemove", d => {
                var percentage = Math.round((parseFloat(d.scopus_profiles) / parseFloat(d.total) * 100) * 10) / 10;
                d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(d[xName] + "<br>Scopus Profiles: " + d.scopus_profiles + "<br>(" + percentage + "% coverage)");
            })
            .on("mouseout", () => { d3.select(".tooltip").style("display", "none")})
            .transition().duration(1000)
            .style("opacity", 1)

        /* Orcid */
        g.append("rect")
        .attr("class", "")
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => graph_params.innerHeight - y(d.orcid_profiles / d.total))
        .attr("x", d => x(d[xName]) + x.bandwidth() /2)
        .attr("y", d => y(d.orcid_profiles / d.total))
        .attr("fill", d => "url(#"+linearGradient(d, max, false)+")")
        .style("opacity", 0)
        .on("mousemove", d => {
            var percentage = Math.round((parseFloat(d.orcid_profiles) / parseFloat(d.total) * 100) * 10) / 10;
            d3.select(".tooltip")
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html(d[xName] + "<br>Orcid Profiles: " + d.orcid_profiles + "<br>(" + percentage + "% coverage)");
        })
        .on("mouseout", () => { d3.select(".tooltip").style("display", "none")})
        .transition().duration(1000)
        .style("opacity", 1)
        
        
        /* ADD TOTAL LINES (removed, but kept the code just in case) */
        /* var line = d3.line()
            .x(d => x(d[xName]) + x.bandwidth() / 2)
            .y(d => yRight(d.total))
            .curve(d3.curveMonotoneX) */

        //svg.append("path").datum(data).attr("class", "line").attr("d", line);

        /* svg.selectAll(".dot")
        .data(data)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function(d) { return x(d[xName]) + x.bandwidth()/2 })
        .attr("cy", function(d) { return yRight(d.total) })
        .attr("r", 5)
        .on("mouseover", function(d) {
            d3.select(this).attr('class', 'focus').attr("r", 10);
            d3.select(".tooltip")
                        .style("left", d3.event.pageX - 80 + "px")
                        .style("top", d3.event.pageY - 60 + "px")
                        .style("display", "inline-block")
                        .html("Total people in this group<br><strong>" + d.total + "</strong>");
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("class", "dot").attr("r", 5);
            d3.select(".tooltip").style("display", "none")
        }) */

        // add the x Axis
        var xAxis = d3.axisBottom(x)
        
        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars and rotate them */
            .selectAll("text")
            .attr("transform", "rotate(-90), translate(-65,-15)")

        d3.selectAll(".x .tick text").style("font-size", "10pt");

        // add the y Axis (left)
         svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format(".0%"))); // Format the ticks as percentages

        // add the y Axis (right) (removed, used for the line)
        /* svg.append("g")
            .attr("class", "yRight")
            .attr("transform", "translate(" + (graph_params.innerWidth) + ", 0)")
            .call(d3.axisRight(yRight)); */

        /* Add the legend */
        var legend = svg.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left - 20)+",-25)");

        var legendOrdinal = d3.legendColor()
            .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
            .shapePadding(40)
            .orient("horizontal")
            .labelAlign("middle")
            .labelOffset(5)
            .scale(d3.scaleOrdinal().domain(["Scopus", "Orcid"]).range(["darkorange", "forestgreen"]));

        legend.call(legendOrdinal);

        /* Append the name of the axes to the svg */
        appendAxesLabels("", "Number of People (%)")
    });    
}

/* Show the subject areas obtained by Scopus to see how the ERC Grants are distributed across different domains. */
graph_draw.subjects = function(grouped = true, sortBy = "total") {
    var svg = graph_draw.init(); // The graph
    var xName = "nation" // Name of the x property

    d3.csv("data/subjects.csv").then(data => {
        /* Sort the data according to either the total or the field the user chose */
        data.sort((a, b) => { return (+b[sortBy]) - (+a[sortBy]) });

        /* x-scale (bands) */
        var x = d3.scaleBand()
            .range([0, graph_params.innerWidth])
            .padding(0.2).round(true)
            .domain(data.map(d => d[xName]))

        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.total )])
            .range([graph_params.innerHeight, 0])   

        var stackedScale = d3.scaleLinear()
            .domain(y.domain())
            .range([0, graph_params.innerHeight]) // Inverted!

        /* The fields to consider whether they are grouped or not */
        var keys = (grouped) ? ["SH","PE","LS"] : [
            'AGRI',
            'ARTS',
            'BIOC',
            'BUSI',
            'CENG',
            'CHEM',
            'COMP',
            'DECI',
            'DENT',
            'EART',
            'ECON',
            'ENER',
            'ENGI',
            'ENVI',
            'HEAL',
            'IMMU',
            'MATE',
            'MATH',
            'MEDI',
            'NEUR',
            'NURS',
            'PHAR',
            'PHYS',
            'PSYC',
            'SOCI',
            'VETE',
            'MULT'
        ]

        /* Associate each field to a color */
        var colors = {
            "SH": "#027af4", "PE": "#699900", "LS": "#CA626B",
            "AGRI": "#ff5459", "ARTS": "#ff9f85", "BIOC": "#a31a06", "BUSI": "#ff8a59", "CENG": "#863d1e",
            "CHEM": "#f97122", "COMP": "#ffa04c", "DECI": "#c38000", "DENT": "#f3be5d", "EART": "#6c5527",
            "ECON": "#e6bd00", "ENER": "#d2c884", "ENGI": "#596900", "ENVI": "#007122", "HEAL": "#00c053",
            "IMMU": "#215e38", "MATE": "#60dd9b", "MATH": "#60a587", "MEDI": "#019a70", "NEUR": "#01c8ae",
            "NURS": "#64b9ff", "PHAR": "#567dff", "PHYS": "#a198ff", "PSYC": "#763a84", "SOCI": "#ff97ff",
            "VETE": "#b4008b", "MULT": "#ff76b6"
        }
        /* Move the stacked bars up or down according to the one chosen by the user
         * i.e. the one chosen will be the first "piece" of bar (vertically).
         */
        var sortedKeys = (sortBy == "total") ? keys : keys.splice(keys.indexOf(sortBy), 1).concat(keys)
        var stackLayout = d3.stack().keys(sortedKeys);
        /* This is done for associating everytime the same color to the same subject area */
        var colorRange = []
        sortedKeys.forEach(k => { colorRange.push(colors[k]) }) 

        var colorScale = d3.scaleOrdinal().domain(stackLayout.keys()).range(colorRange)

        /* Append the bars */
        var g = svg.selectAll("rect.scopus")
            .data(stackLayout(data))
            .enter()
            .append("g");

        g.each(function(d) {
            d3.select(this).selectAll("rect") 
                .data(d)
                .enter()
                .append("rect")
                .attr("width", x.bandwidth())
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(data[i][xName])})
                .attr("y", p => y(p[1]))
                .style("fill", colorScale(d.key)) 
                .style("opacity", 0)
                .on("mousemove", p => { // Append the tooltip showing the complete name of this subject area
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(subjDescriptions[d.key] + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(500)
                .style("opacity", 1)

            })
        
        if(!grouped) // For the ungrouped areas we need to manually create the legend (to subdivide it into three columns)
            buildLegendForSubjects(svg, colorScale);
        else { // Otherwise append the classic legend
            var legend = svg.append("g")
                .attr("class", "legendOrdinal")
                .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left)+",20)");

            var legendOrdinal = d3.legendColor()
                .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
                .shapePadding(10)
                .scale(colorScale)
                .title("Sort by:")

            legend.call(legendOrdinal);
        }

        // add the x Axis
        var xAxis = d3.axisBottom(x)

        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars and rotate them */
            .selectAll("text")
            .attr("transform", "rotate(-90), translate(-50,-15)")

        d3.selectAll(".x .tick text").style("font-size", "10pt");


        // add the y Axis
        svg.append("g")
             .call(d3.axisLeft(y));

        /* Append the Axes labels */
        appendAxesLabels("", "Number of People")
        /* Append the tooltip for the legend */
        appendLegendTooltip();

        /* When the user clicks on a field on the legend, redraw the graph sorting bars according to that field */
        d3.selectAll(".label").style("cursor", "pointer").on('click', function() {
            graph_draw.fadeOut();
            
            sleep(1100).then( () => {
                d3.select("svg").remove();
                graph_draw.subjects(grouped, d3.select(this).text())
                /* Add a "revert" button to go back to the original sorting */
                d3.select(".graphTitle").html(d3.select(".graphTitle").text() + " &mdash; <a href=\"javascript:void();\" onclick=\"graph_draw.fadeOut(); sleep(1100).then( () => { d3.select('svg').remove(); graph_draw.subjects("+grouped+")}); return false;\" style=\"text-decoration: underline; color: blue !important;\" title=\"Revert back to visualization sorted by total people\">Remove Sorting</a>")
            });
        })

    });
}

/* Animates and removes the bars from a graph */
graph_draw.fadeOut = function() {
    var svg = d3.select("svg g");
    svg.selectAll("rect")
        .data([])
        .exit()
        /* Animate the exiting of the bars */
        .transition()
        .duration(1000)
        .ease(d3.easeExp)
        .attr("height", 0)
        .remove();
}

/* Show the standard view: by Year */
graph_draw.byYear();

/* Append a table with a brief summary read from the general.csv file */
d3.csv("data/general.csv").then(function(data) {
    var d = data[0];
    d3.select("#total_people").text(d.total_people);
    d3.select("#scopus_total").text(d.scopus_profiles);
    d3.select("#orcid_total").text(d.orcid_profiles);
    d3.select("#scopus_with_orcid").text(d.scopus_with_orcid);
});

/* Change the view when clicking on the radio buttons */
d3.selectAll("input[type=radio]").on('click', function() {
    var oldGroup = graph_params.group;
    var newGroup = d3.event.target.value;
    if(newGroup == "subjects") {
        /* Show the checkbox for grouping the subjects */
        d3.select("input[name=grouped]").transition().duration(300).style("opacity","1")
        d3.select("label[for=subjectsGrouped]").transition().duration(300).style("opacity","1")
    }
    else {
        /* Hide the checkbox */
        d3.select("input[name=grouped]").transition().duration(300).style("opacity","0")
        d3.select("label[for=subjectsGrouped]").transition().duration(300).style("opacity","0")
    }

    /* Prevents the redrawing of the same graph */
    if(oldGroup == newGroup)
        return;

    graph_draw.fadeOut(); // Fade out the old graph
    graph_params.group = newGroup; // Change the global variable referring to the current view 

    sleep(1100).then(function() { // When all the transitions have endend...
        d3.select("svg").remove(); // Remove the old svg
        switch(newGroup) { // Draw the new one
            case "grant":
                graph_draw.byGrant();
                break;
            case "nation":
                graph_draw.byNation();
                break;
            case "subjects":
                console.log(d3.select("input[name=grouped]").property("checked"))
                graph_draw.subjects(d3.select("input[name=grouped]").property("checked"));
                break;
            default:
                graph_draw.byYear();
                break;
        }
        updateExplanation(d3.select("input[name=grouped]").property("checked")); // Update the "about" box accordingly
    });
})

/* Group or ungroup the subject by macroareas - done via a checkbox */
d3.select("input[name=grouped]").on('click', function() {
    /* As the checkbox is clickable even if it is not visibile, prevent it from being clicked if
     * the current view is not the right one 
     */
    if(graph_params.group != "subjects") {
        d3.event.preventDefault();
        return false;
    }

    d3.select("svg").transition().duration(200).style("opacity","0") // Fade the old graph

    var checked = d3.event.target.checked; // True: grouped, false: ungrouped
    sleep(250).then(function() { // After it has faded, remove it and draw the new one
        d3.select("svg").remove();
        graph_draw.subjects(checked);
        updateExplanation(checked);
    });
})

d3.select(".container").style("height", (graph_params.height - 100) + "px");