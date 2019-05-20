/* Utility function for creating an array of integers from min to max */
function range(min, max) {
    return Array.apply(null, {length: max + 1 - min}).map(function(_, idx) {
        return idx + min;
    });
}

/* Sleep utility function */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Utility function for writing the title of the graph */
function build_title(svg) {
    var text_field = svg.select("text");
    var checked_field = d3.select("input[type=radio]:checked").attr("id")
    if(text_field.empty()) { // If there wasn't already a title, append it
        svg.append("text")
            .attr("class", "graphTitle")
            .attr("x", (graph_params.innerWidth - graph_params.margin.left) / 2)
            .attr("y", "-20")
            .attr("text-anchor", "middle")
            .html(d3.select("label[for=" + checked_field + "]").text().replace("by ",""));
    }
    else {
        text_field.html(d3.select("input[type=radio]:checked").text().replace("by ",""));
    }
}

function initPatterns(defs) {
    defs.append('pattern')
    .attr('id', 'diagonalHatch')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 4)
    .append('rect')
    .attr('width', 4)
    .attr('height', 4)
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "none");

    defs.append("pattern")
    .attr("id", "circles")
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 2)
    .attr('height', 2)
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 1)
    .attr("stroke", "none")
    .attr("fill", "rgba(0,0,0,0.5)")

    d3.select('svg pattern#diagonalHatch').append('path')
    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
    .attr('stroke', '#010101')
    .attr('stroke-width', 1)
    .attr("opacity", 0.3);
}

/* appends the bars corresponding to the total values of a group */
function appendTotalBars(g, x, y, isScaleBand = false, xName = "") {
    g.append("rect")
        .attr("class", "bar total")
        .attr("x", d => { return (isScaleBand) ? x(d[xName]) : (x(d.x0) + graph_params.spaceBetweenBars) })
        .attr("y", d => { return y((Array.isArray(d)) ? d[0]["total"] : d["total"]) })
        .on("mousemove", function(d) {
            /* d3.select(".tooltip")
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html("Total people in this group: <strong>" + (Array.isArray(d) ? d[0] : d)["total"] + "</strong>"); */
        })
        .on("mouseout", function(d) {
            d3.select(".tooltip").style("display", "none");
        })
        .attr("width", function(d) { return (isScaleBand) ? x.bandwidth() : Math.max(x(d.x1) - x(d.x0) - graph_params.spaceBetweenBars * 2, 0); })
        .attr("height", function(d) { return graph_params.innerHeight - y((Array.isArray(d)) ? d[0]["total"] : d["total"]); })
}

function keyYearToGrant(key) {
    switch(key.replace("scopus_","").replace("orcid_", "")) {
        case "stg":
            return "Starting Grants";
        case "cog":
            return "Consolidator Grants";
        case "adg":
            return "Avdanced Grants";
        case "poc":
            return "Proofs of Concept"
    }
}

function keyGrantToYear(key) {
    return key.replace("scopus_","").replace("orcid_","");
}

function linearGradient(d, max, scopus = true) {
    var gradId = "grad_" + d.nation.toLowerCase().replace(" ","") + ((scopus) ? "_scopus" : "_orcid");

    var colors = scopus ? ["rgb(255,69,0)", "rgb(255,140,0)", "rgb(255,180,0)"] : ["rgb(34,139,34)", "rgb(60,179,113)", "rgb(144,238,144)"];
    console.log(colors);

    d3.select("defs")
    .append("linearGradient")
    .attr("id",gradId)
    .attr("x1","50%")
    .attr("y1","100%")
    .attr("x2", "50%")
    .attr("y2", "0%")
    .append("stop").attr("offset", "0%").attr("style","stop-color:" + colors[0] + ";stop-opacity:1")
    
    d3.select("linearGradient#"+gradId)
    .append("stop").attr("offset", Math.max(Math.log(d.total)/Math.log(max-100)*100 - 5, 1) + "%").attr("style", "stop-color:" + colors[1] + ";stop-opacity:1")
    
    d3.select("linearGradient#"+gradId).append("stop").attr("offset", "100%").attr("style", "stop-color:" + colors[2] + ";stop-opacity:0.4");

    return gradId;
}

function appendAxesLabels(x, y) {
    // text label for the x axis
    d3.select("svg > g").append("text")     
    .attr("transform", "translate(" + (graph_params.innerWidth/2) + " ," + (graph_params.innerHeight + graph_params.margin.top - 10) + ")")
    .style("text-anchor", "middle")
    .text(x);

    // text label for the y axis
    d3.select("svg > g").append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - graph_params.margin.left)
    .attr("x",0 - (graph_params.innerHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text(y);  
}

function createLegend(svg) {
    var g = svg.append(g)
}