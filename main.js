var graph_params = {
    group: "starting_year", /* Website non ci interessa più, showTotal sempre true */
    width: 880,
    height: 680,
    margin: { top: 50, right: 30, bottom: 30, left: 70 },
    innerWidth: 870 - 70 - 30,
    innerHeight: 600 - 50 - 30,
    spaceBetweenBars: 7, /* Spacing between two bars */
    emptySpace: 0.3 /* Percentage of the width of a bar */
}

graph_draw = {};

/* Appends a new svg graph to the body, adjusting its width and its height. */
graph_draw.init = function() {
    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // move the 'group' element to the top left margin
    var svg = d3.select(".container").append("svg")
        .attr("width", graph_params.width) //+ graph_params.margin.left + graph_params.margin.right)
        .attr("height", graph_params.height)// + graph_params.margin.top + graph_params.margin.bottom)
    .append("g")
        .attr("transform", 
            "translate(" + graph_params.margin.left + "," + graph_params.margin.top + ")");

    /* Append the tooltip on the histogram if it was not already there */
    if(d3.select(".tooltip").empty())
        d3.select("body").append("div").attr("class", "tooltip");

    build_title(svg);

    /* Patterns */
    var defs = svg.append('defs');
    initPatterns(defs);

    return svg;
};

graph_draw.byYear = function() {
    /* Mostra sia Scopus che Orcid */
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property


    d3.csv("data/" + xName + ".csv").then(data => {
        /* x-scale (linear) */
        var x = d3.scaleLinear()
            .domain([d3.min(data, d => { return d[xName] }), d3.max(data, d => {return d[xName]})])
            .range([0, graph_params.innerWidth]);

        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, d => { return +d.total } )])
            .range([graph_params.innerHeight, 0])

        var stackedScale = d3.scaleLinear()
            .domain(y.domain())
            .range([0, graph_params.innerHeight]) // Inverted with respect to y

        var stackLayoutScopus = d3.stack().keys(["scopus_stg", "scopus_cog", "scopus_adg", "scopus_poc"]);
        var colorScale = d3.scaleOrdinal().domain(stackLayoutScopus.keys()).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F"])

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
                .attr("y", graph_params.innerHeight)
                .attr("height", 0)
                .transition().duration(1000)
                .attr("height", () => { return graph_params.innerHeight - y(d["total"]); })
                .attr("y", y(d["total"]))

            d3.select(this)
                .on("mousemove", () => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("Total people starting this year<br><strong>" + d["total"] + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
        })
        
        /* Append data bars */
                // append the bar rectangles to the svg element
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
                .style("fill", colorScale(d.key)) 
                .style("opacity", 0)
                .on("mousemove", p => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("(Scopus) "+keyYearToGrant(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)

                /*r.append("rect")
                .attr("width", 40)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(i+2014) + 5 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("fill", "url(#circles)") 
                .style("opacity", 0)
                .on("mousemove", p => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(keyYearToGrant(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1) */
            })


        var stackLayoutOrcid = d3.stack().keys(["orcid_stg", "orcid_cog", "orcid_adg", "orcid_poc"]);
        colorScale = d3.scaleOrdinal().domain(stackLayoutOrcid.keys()).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F"])
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
                .on("mousemove", p => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(keyYearToGrant(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)

                r.append("rect")
                .attr("width", 40)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(i+2014) + 55 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("opacity", 0) 
                .style('fill', 'url(#diagonalHatch)')
                .on("mousemove", p => {
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
        
        appendAxesLabels("Starting Year", "Number of People")

        var legend = svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left - 20)+",20)");

        var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
        .shapePadding(10)
        .title("Grant Type")
        //use cellFilter to hide the "e" cell
        .scale(d3.scaleOrdinal().domain(["Starting","Consolidator","Advanced","Proof of Concept"]).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F"]))

        legend.call(legendOrdinal)
    });
}

graph_draw.byGrant = function() {
    /* Mostra sia Scopus che Orcid */
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property

    d3.csv("data/" + xName + ".csv").then(data => {
        /* x-scale (linear) */
        var x = d3.scaleBand()
            .range([0, graph_params.innerWidth])
            .padding(0.2).round(true)
            .domain(data.map(function(d) { return d[xName]; }))
        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, d => { return +d.total } )])
            .range([graph_params.innerHeight, 0]) // Solita, normale.

        var stackedScale = d3.scaleLinear()
            .domain(y.domain())
            .range([0, graph_params.innerHeight]) // Inverted!

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
                .attr("x", () => { return  x(d[xName])}) //+ graph_params.spaceBetweenBars})
                .attr("height", 0)
                .attr("y", graph_params.innerHeight)
                .transition().duration(1000)
                .attr("height", () => { return graph_params.innerHeight - y(d.total); })
                .attr("y", y(d.total))

            d3.select(this)
                .on("mousemove", () => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("Total people in this group<br><strong>" + d.total + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
        })

        /* Append data bars (Scopus) */
                // append the bar rectangles to the svg element
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

                /*r.append("rect")
                .attr("width", x.bandwidth()/2.5)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { console.log(data[i]); return x(data[i][xName]) + 5 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                .style("fill", "url(#circles)") 
                .style("opacity", 0)
                .on("mousemove", p => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html("Started in " + keyGrantToYear(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)*/
            })

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
                //.style('fill', 'url(#diagonalHatch)')
                .on("mousemove", p => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(keyGrantToYear(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(1000)
                .style("opacity", 1)

                r.append("rect")
                .attr("width", x.bandwidth()/2.5)
                .attr("height", p => { return stackedScale(p[1]) - stackedScale(p[0]) })
                .attr("x", (p, i) => { return x(data[i][xName]) + (x.bandwidth()/2.5) + 10 + graph_params.spaceBetweenBars})
                .attr("y", p => y(p[1]))
                //.style("fill", colorScale(d.key)) 
                .style("opacity", 0)
                .style('fill', 'url(#diagonalHatch)')
                .on("mousemove", p => {
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
        var xAxis = d3.axisBottom(x)//.tickValues(range(parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName]} )))).tickFormat(d3.format(".0f"));
        var barWidth = x.bandwidth();
 
        svg.append("g")
             .attr("class", "x")
             .attr("transform", "translate(0," + graph_params.innerHeight + ")")
             .call(xAxis)
             /* Move the labels at the center of the bars */
             .selectAll("text")
             //.style("text-anchor", "")
             //.attr("transform", "translate(" + barWidth / 2 + ", 0)")
 
        // add the y Axis
        svg.append("g")
             .call(d3.axisLeft(y));

        appendAxesLabels("Type of Grant", "Number of People")

        var legend = svg.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left)+",20)");

        var legendOrdinal = d3.legendColor()
            .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
            .shapePadding(10)
            .title("Started in")
            //use cellFilter to hide the "e" cell
            .scale(d3.scaleOrdinal().domain(["2014","2015","2016","2017","2018","2019","2020"]).range(["#fcd88a", "#cf7c1c", "#93c464", "#75734F", "#5eafc6", "#41a368", "#f00"]))

        legend.call(legendOrdinal)
    });
    
}

graph_draw.byNation = function() {
    /* Mostra sia Scopus che Orcid */
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property

    d3.csv("data/" + xName + ".csv").then(data => {
        /* x-scale (band/ordinal) */
        var x = d3.scaleBand()
        .range([0, graph_params.innerWidth])
        .padding(0.2).round(true)
        .domain(data.map(d => d[xName] ))

        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, 1]) // Percentage //d3.max(data, d => +d.total )])
            .range([graph_params.innerHeight, 0]) // Solita, normale.

        var yRight = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.total)])
            .range([graph_params.innerHeight, 0])

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
                        .html("Total people in "+d[xName]+"<br><strong>" + d.total + "</strong>");
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
        
        
        /* ADD TOTAL LINES */
        var line = d3.line()
            .x(d => x(d[xName]) + x.bandwidth() / 2)
            .y(d => yRight(d.total))
            .curve(d3.curveMonotoneX)

        //svg.append("path").datum(data).attr("class", "line").attr("d", line);

        // 12. Appends a circle for each datapoint 
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
        var xAxis = d3.axisBottom(x)//.tickValues(range(parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName]} )))).tickFormat(d3.format(".0f"));

        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars */
            .selectAll("text")
            //.style("text-anchor", "")
            .attr("transform", "rotate(-65), translate(-45,5)")

        d3.selectAll('.x .tick text')
            .data(data)
            .on("mousemove", function(d) {
                /* var elem = (Array.isArray(d)) ? d[0] : d;
                var percentage = Math.round((parseFloat(elem[yValue]) / parseFloat(elem["total"]) * 100) * 100) / 100;
                d3.select(".tooltip")
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html("<strong>"+d.nation + "</strong><br>Profiles Found: " + (Array.isArray(d) ? d[0][yValue] : d[yValue]) + "<br> (<strong>" + percentage + "%</strong> coverage)");
                    */
            })
            .on('mouseout', function() { d3.select(".tooltip").style("display","none")});
        //d3.select(".x .tick").on("mousemove", function() { d3.select(".tooltip").style("display","inline-block")});

        d3.selectAll(".x .tick text").style("font-size", "10pt");

        // add the y Axis (left)
         svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));
        // add the y Axis (right)
        /* svg.append("g")
            .attr("class", "yRight")
            .attr("transform", "translate(" + (graph_params.innerWidth) + ", 0)")
            .call(d3.axisRight(yRight)); */

        var legend = svg.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left - 20)+",-25)");

        var legendOrdinal = d3.legendColor()
            .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
            .shapePadding(40)
            //use cellFilter to hide the "e" cell
            .orient("horizontal")
            .labelAlign("middle")
            .labelOffset(5)
            .scale(d3.scaleOrdinal().domain(["Scopus", "Orcid"]).range(["darkorange", "forestgreen"]));

        legend.call(legendOrdinal);

        appendAxesLabels("", "Number of People (%)")
    });    
}

graph_draw.subjects = function(grouped = true) {
    /* Mostra sia Scopus che Orcid */
    var svg = graph_draw.init(); // The graph
    var xName = "nation"//graph_params.group; // Name of the x property

    d3.csv("data/subjects.csv").then(data => {
        data.sort((a, b) => { return (+b.total) - (+a.total) });
        /* x-scale (band/ordinal) */
        var x = d3.scaleBand()
            .range([0, graph_params.innerWidth])
            .padding(0.2).round(true)
            .domain(data.map(d => d[xName]))

        /* y-scale (linear, stacked) */
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d.total )])
            .range([graph_params.innerHeight, 0]) // Solita, normale.   

        var stackedScale = d3.scaleLinear()
            .domain(y.domain())
            .range([0, graph_params.innerHeight]) // Inverted!

        var stackLayout = (grouped) ? d3.stack().keys(["SH","PE","LS"]) : d3.stack().keys([
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
            'MULT',
        ]);
        var colorScale = d3.scaleOrdinal().domain(stackLayout.keys()).range((grouped) ? ["#1329D3", "#006494", "#387780"] : [
            "#1329D3", "#006494", "#387780", "#1B98E0", "#E8F1F2", "#4A7C59", "#68B0AB", "#8FC0A9", "#C8D5B9",
            "#565554", "#2E86AB", "#F5F749", "#F24236", "#2F52E0", "#BCED09", "#F9CB40", "#4C5B5C", "#86E7B8",
            "#FFF07C", "#BC9EC1", "#87BBA2", "#DB4C40", "#F0C987", "#3C153B", "#8B1E3F", "#456990", "#E4FDE1"
            /*"#fcd88a", "#cf7c1c", "#93c464", "#75734F", "#5eafc6", "#41a368", "#f00", "#0f0", "#00f",
            "#fcd88a", "#cf7c1c", "#93c464", "#75734F", "#5eafc6", "#41a368", "#f00", "#0f0", "#00f",
            "#fcd88a", "#cf7c1c", "#93c464", "#75734F", "#5eafc6", "#41a368", "#f00", "#0f0", "#00f"*/
        ])

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
                /* SISTEMARE LA X PER LA SCALA ORDINALE */
                .attr("x", (p, i) => { return x(data[i][xName])})
                .attr("y", p => y(p[1]))
                .style("fill", colorScale(d.key)) 
                .style("opacity", 0)
                .on("mousemove", p => {
                    d3.select(".tooltip")
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .html(keyGrantToYear(d.key) + ": <strong>" + (p[1] - p[0]) + "</strong>");
                })
                .on("mouseout", () => { d3.select(".tooltip").style("display", "none") })
                .transition().duration(500)
                .style("opacity", 1)

            })
        
        var legend = svg.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate("+(graph_params.innerWidth - graph_params.margin.left)+",20)");

        var legendOrdinal = d3.legendColor()
            .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
            .shapePadding(10)
            //use cellFilter to hide the "e" cell
            .scale(colorScale);

        legend.call(legendOrdinal);

        // add the x Axis
        var xAxis = d3.axisBottom(x)//.tickValues(range(parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName]} )))).tickFormat(d3.format(".0f"));

        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars */
            .selectAll("text")
            //.style("text-anchor", "")
            .attr("transform", "rotate(-65), translate(-45,5)")


        // add the y Axis
        svg.append("g")
             .call(d3.axisLeft(y));

    });
}


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

graph_draw.byYear();

d3.select(".selector").style("height", d3.select("svg").attr("height"))
d3.select(".selector").style("display","block");

/* Append a table with a brief summary */
d3.csv("data/general.csv").then(function(data) {
    var d = data[0];
    d3.select("#total_people").text(d.total_people);
    d3.select("#scopus_total").text(d.scopus_profiles);
    d3.select("#orcid_total").text(d.orcid_profiles);
    d3.select("#scopus_with_orcid").text(d.scopus_with_orcid);
});

d3.selectAll("input[type=radio]").on('click', function() {
    var oldGroup = graph_params.group;
    var newGroup = d3.event.target.value;
    if(newGroup == "subjects") {
        d3.select("input[name=grouped]").transition().duration(300).style("opacity","1")
        d3.select("label[for=subjectsGrouped]").transition().duration(300).style("opacity","1")
    }
    else {
        d3.select("input[name=grouped]").transition().duration(300).style("opacity","0")
        d3.select("label[for=subjectsGrouped]").transition().duration(300).style("opacity","0")
    }
    if(oldGroup == newGroup)
        return;
    graph_draw.fadeOut(); // Fade out the old graph
    graph_params.group = newGroup;
    sleep(1100).then(function() {
        d3.select("svg").remove();
        switch(newGroup) {
            case "grant":
                graph_draw.byGrant();
                break;
            case "nation":
                graph_draw.byNation();
                break;
            case "subjects":
                graph_draw.subjects();
                break;
            default:
                graph_draw.byYear();
                break;
        }
    });
})

d3.select("input[name=grouped]").on('click', function() {
    d3.select("svg").transition().duration(200).style("opacity","0").remove();
    graph_draw.subjects(d3.event.target.checked);
})