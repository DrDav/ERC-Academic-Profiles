

var graph_params = {
    group: "starting",
    website: "scopus",
    showTotal: true,
    width: 900,
    height: 680,
    margin: { top: 50, right: 30, bottom: 30, left: 40 },
    innerWidth: 900 - 40 - 30,
    innerHeight: 600 - 50 - 30,
    spaceBetween: 10, /* Spacing between two bars */
    emptySpace: 0.3 /* Percentage of the width of a bar */
}

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
    console.log(svg);
    var text_field = svg.select("text");
    if(text_field.empty()) { // If there wasn't already a title, append it
        svg.append("text")
            .attr("class", "graphTitle")
            .attr("x", (graph_params.innerWidth - graph_params.margin.left) / 2)
            .attr("y", "-20")
            .attr("text-anchor", "middle")
            .html(d3.select("select[name=website] > option:checked").text() + " Profiles &mdash; " + d3.select("select[name=grouping] > option:checked").text());
    }
    else {
        text_field.html(d3.select("select[name=website] > option:checked").text() + " Profiles &mdash; " + d3.select("select[name=grouping] > option:checked").text());
    }
}

/* appends the bars corresponding to the total values of a group */
function append_totals(g, x, y, isScaleBand = false, xName = "") {
    g.append("rect")
        .attr("class", "bar_total")
        .attr("x", function(d) { return (isScaleBand) ? x(d[xName]) : (x(d.x0) + graph_params.spaceBetween) })
        .attr("y", function(d) { return y((Array.isArray(d)) ? d[0]["total"] : d["total"]) })
        .on("mousemove", function(d) {
            d3.select(".tooltip")
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html("Total people in this group: <strong>" + (Array.isArray(d) ? d[0] : d)["total"] + "</strong>");
        })
        .on("mouseout", function(d) {
            d3.select(".tooltip").style("display", "none");
        })
        .attr("width", function(d) { return (isScaleBand) ? x.bandwidth() : Math.max(x(d.x1) - x(d.x0) - graph_params.spaceBetween * 2, 0); })
        .attr("height", function(d) { return graph_params.innerHeight - y((Array.isArray(d)) ? d[0]["total"] : d["total"]); })
}

function append_data(g, x, y, yValue, isScaleBand = false, xName = "") {
    var tooltip = d3.select(".tooltip");

    g.append("rect")
        .attr("class", "bar" + " " + graph_params.website)
        .attr("width", function(d) { 
            if(isScaleBand)
                return x.bandwidth() * (graph_params.emptySpace * 2);
            var emptySpace = (x(d.x1) - x(d.x0)) * graph_params.emptySpace;
            console.log("math max", x(d.x1), x(d.x0),Math.max( x(d.x1) - x(d.x0) - ((graph_params.showTotal === true) ? emptySpace : graph_params.spaceBetween) * 2 , 0));
            return Math.max( x(d.x1) - x(d.x0) - ((graph_params.showTotal === true) ? emptySpace : graph_params.spaceBetween) * 2 , 0);
        })
        .on("mousemove", function(d) {
            var elem = (Array.isArray(d)) ? d[0] : d;
            var percentage = Math.round((parseFloat(elem[yValue]) / parseFloat(elem["total"]) * 100) * 100) / 100;
            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html("Profiles Found: " + (Array.isArray(d) ? d[0][yValue] : d[yValue]) + "<br> (<strong>" + percentage + "%</strong> coverage)");
        })
        .on("mouseout", function(d) {
            tooltip.style("display", "none");
        })
        .attr("x", function(d) {
            if(isScaleBand)
                return x(d[xName]) + (x.bandwidth() * (graph_params.emptySpace/1.5));
            console.log(d.x1, d.x0);
            var emptySpace = (x(d.x1) - x(d.x0)) * graph_params.emptySpace;
            return (graph_params.showTotal === true) ? (x(d.x0) + emptySpace) : (x(d.x0) + graph_params.spaceBetween);
        })
        .attr("y", graph_params.innerHeight)
        .attr("height", 0)
        .transition().duration(1000).ease(d3.easeExp)
        .attr("y", function(d) { 
            var yy = (Array.isArray(d)) ? y(d[0][yValue]) : y(d[yValue]);
            if(yy == "Infinity" || yy == "-Infinity")
                return graph_params.innerHeight -1 ;
            return yy;
        })
        .attr("height", function(d) { 
            var yy = y((Array.isArray(d)) ? d[0][yValue] : d[yValue]);
            if(yy == "Infinity" || yy == "-Infinity")
                return 1;
            return graph_params.innerHeight - yy; })
}

var graph_draw = {};

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

    /* Append the tooltip on the histogram */
    var tooltip = d3.select("body").append("div").attr("class", "tooltip");

    return svg;
};

graph_draw.by_year = function() {
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group + "_year"; // Name of the x property
    var yValue = graph_params.website + "_profiles"; // Name of the y property

    build_title(svg);

    // Load the data into the graph
    d3.csv("data/" + graph_params.group + "_years.csv").then(function(data) {
            // Set the ranges
            console.log([parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName] }))+1]);
        var x = d3.scaleLinear()
            .domain([parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName] }))])
            .range([0, graph_params.innerWidth]);
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return parseInt(d["total"]) })])
            .range([graph_params.innerHeight, 0]);

        // Prepare the histogram
        var histogram = d3.histogram()
            .value(function(d) {return parseInt(d[xName]); }) // x values
            .domain(x.domain())
            .thresholds(
                /* From min to max with step 1 */
                x.ticks(- parseInt(d3.min(data, function(d) { return d[xName]} )) + parseInt(d3.max(data, function(d) { return d[xName] })) + 1)
            );
        
        //console.log(x.domain(), y.domain(), x.ticks(), - parseInt(d3.min(data, function(d) { return d[xName]} )) + parseInt(d3.max(data, function(d) { return d[xName] })) + 1);
        // Build the histogram into bins
        var bins = histogram(data);

        // append the bar rectangles to the svg element
        var g = svg.selectAll("rect")
            .data(bins)
            .enter().append("g");

        console.log("la nuova g è ", g)
        // Append bars with total values
        if(graph_params.showTotal === true) {
            append_totals(g, x, y);
        }
        // Append the values
        append_data(g, x, y, yValue);

        // add the x Axis
        var xAxis = d3.axisBottom(x)
            .tickValues(range(parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName]} ))))
            .tickFormat(d3.format(".0f"));
        //var barWidth = Math.floor(x(x.ticks(xAxis.ticks()[0])[1]) - x(x.ticks(xAxis.ticks()[0])[0])) - 1;
        var barWidth = (graph_params.showTotal) ? d3.select(".bar_total").attr("width") / 2 : d3.select(".bar").attr("width") / 2;
        console.log("barwidth", barWidth);

        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars */
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + barWidth + ", 0)")

        d3.selectAll('.x .tick text')
            .data(data)
            .on("mousemove", function(d) {
                var elem = (Array.isArray(d)) ? d[0] : d;
                var percentage = Math.round((parseFloat(elem[yValue]) / parseFloat(elem["total"]) * 100) * 100) / 100;
                d3.select(".tooltip")
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html("Profiles Found: " + (Array.isArray(d) ? d[0][yValue] : d[yValue]) + "<br> (<strong>" + percentage + "%</strong> coverage)");
            })
            .on('mouseout', function() { d3.select(".tooltip").style("display","none")});

        // add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

    });
};

graph_draw.by_grant = function() {
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property
    var yValue = graph_params.website + "_profiles"; // Name of the y property

    build_title(svg);

    // Load the data into the graph
    d3.csv("data/" + graph_params.group + "s.csv").then(function(data) {
        // Set the ranges
        //var xScale = d3.scaleBand().range([0, width]).padding(0.2).round(true);
        var x = d3.scaleBand()
            .range([0, graph_params.innerWidth])
            .padding(0.2).round(true)
            .domain(data.map(function(d) { return d[xName]; }))
            //.range([0, graph_params.innerWidth]);
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return parseInt(d["total"]) })])
            .range([graph_params.innerHeight, 0]);

        // Prepare the histogram
        var histogram = d3.histogram()
            .value(function(d) { return d[xName]; }) // x values
            .domain(x.domain())

        var bins = histogram(data);
        console.log("bins", bins);
        console.log("data", data);
        // append the bar rectangles to the svg element
        var g = svg.selectAll("rect")
            .data(data)
            .enter().append("g");

        // Append bars with total values
        if(graph_params.showTotal === true) {
            append_totals(g, x, y, true, xName);
        }
        // Append the values
        append_data(g, x, y, yValue, true, xName);

        // add the x Axis
        var xAxis = d3.axisBottom(x)//.tickValues(range(parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName]} )))).tickFormat(d3.format(".0f"));
        var barWidth = x.bandwidth();
        console.log("barwidth", barWidth);

        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars */
            .selectAll("text")
            //.style("text-anchor", "")
            //.attr("transform", "translate(" + barWidth / 2 + ", 0)")

        d3.selectAll('.x .tick text')
            .data(data)
            .on("mousemove", function(d) {
                var elem = (Array.isArray(d)) ? d[0] : d;
                var percentage = Math.round((parseFloat(elem[yValue]) / parseFloat(elem["total"]) * 100) * 100) / 100;
                d3.select(".tooltip")
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html("Profiles Found: " + (Array.isArray(d) ? d[0][yValue] : d[yValue]) + "<br> (<strong>" + percentage + "%</strong> coverage)");
            })
            .on('mouseout', function() { d3.select(".tooltip").style("display","none")});

        // add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y));
        
    });

}

graph_draw.by_nation = function() {
    var svg = graph_draw.init(); // The graph
    var xName = graph_params.group; // Name of the x property
    var yValue = graph_params.website + "_profiles"; // Name of the y property

    build_title(svg);

    // Load the data into the graph
    d3.csv("data/" + graph_params.group + "s.csv").then(function(data) {
        // Set the ranges
        //var xScale = d3.scaleBand().range([0, width]).padding(0.2).round(true);
        var x = d3.scaleBand()
            .range([0, graph_params.innerWidth])
            .padding(0.2).round(true)
            .domain(data.map(function(d) { return d[xName]; }))
            //.range([0, graph_params.innerWidth]);
        var y = d3.scaleLog()
            .domain([1, 1000])//d3.max(data, function(d) { return parseInt(d["total"]) })])
            .range([graph_params.innerHeight, 0]);

        // Prepare the histogram
        var histogram = d3.histogram()
            .value(function(d) { return d[xName]; }) // x values
            .domain(x.domain())

        var bins = histogram(data);
        console.log("bins", bins);
        console.log("data", data);
        // append the bar rectangles to the svg element
        var g = svg.selectAll("rect")
            .data(data)
            .enter().append("g");

        // Append bars with total values
        if(graph_params.showTotal === true) {
            append_totals(g, x, y, true, xName);
        }
        // Append the values
        append_data(g, x, y, yValue, true, xName);

        // add the x Axis
        var xAxis = d3.axisBottom(x)//.tickValues(range(parseInt(d3.min(data, function(d) { return d[xName]} )), parseInt(d3.max(data, function(d) { return d[xName]} )))).tickFormat(d3.format(".0f"));
        var barWidth = x.bandwidth();
        console.log("barwidth", barWidth);

        svg.append("g")
            .attr("class", "x")
            .attr("transform", "translate(0," + graph_params.innerHeight + ")")
            .call(xAxis)
            /* Move the labels at the center of the bars */
            .selectAll("text")
            //.style("text-anchor", "")
            .attr("transform", "rotate(-65), translate(-30,-5)")

        d3.selectAll('.x .tick text')
            .data(data)
            .on("mousemove", function(d) {
                var elem = (Array.isArray(d)) ? d[0] : d;
                var percentage = Math.round((parseFloat(elem[yValue]) / parseFloat(elem["total"]) * 100) * 100) / 100;
                d3.select(".tooltip")
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html("<strong>"+d.nation + "</strong><br>Profiles Found: " + (Array.isArray(d) ? d[0][yValue] : d[yValue]) + "<br> (<strong>" + percentage + "%</strong> coverage)");
            })
            .on('mouseout', function() { d3.select(".tooltip").style("display","none")});
        //d3.select(".x .tick").on("mousemove", function() { d3.select(".tooltip").style("display","inline-block")});

        // add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y).ticks(7, ".0s"))//.tickFormat(d3.format(".0s")));

        d3.selectAll(".x .tick text").style("font-size", "10pt");
        
    });

}

graph_draw.fadeOut = function() {
    var svg = d3.select("svg > g");
    svg.selectAll("rect")
        .data([])
        .exit()
        /* Animate the exiting of the bars */
        .transition()
        .duration(500)
        .ease(d3.easeExp)
        .attr("height", 0)
        .remove();
}

/* Default graph = scopus, by year */
graph_draw.by_year();
//build_histogram_by_year();

d3.select("select[name=website]")
    .on("change", function() {
        graph_draw.fadeOut(); // Fade out the old graph
        var val = d3.event.target.value;
        graph_params.website = val;
        sleep(500).then(function() {
            d3.select(".container > svg").remove();
            switch(graph_params.group) {
                case "grant":
                    graph_draw.by_grant();
                    break;
                case "nation":
                    graph_draw.by_nation();
                    break;
                default:
                    graph_draw.by_year();
                    break;
            }
        });
        //build_histogram_by_year(params.years, params.website, params.showTotal);
    });

d3.select("select[name=grouping]")
    .on("change", function() {
        graph_draw.fadeOut(); // Fade out the old graph
        var val = d3.event.target.value;
        graph_params.group = val;
        sleep(500).then(function() {
            d3.select("svg").remove();
            switch(val) {
                case "grant":
                    graph_draw.by_grant();
                    break;
                case "nation":
                    graph_draw.by_nation();
                    break;
                default:
                    graph_draw.by_year();
                    break;
            }
        });
        
    });

/* d3.select("input[name=percentage]")
    .on("click", function() {
        update_histogram("ending", "scopus");
    }); */

d3.select("input[name=total]")
    .on("click", function() {
        params.showTotal = !params.showTotal;
        graph_draw.fadeOut(); // Fade out the old graph
        sleep(500).then(function() {
            d3.select("svg").remove();
            switch(graph_params.group) {
                case "grant":
                    graph_draw.by_grant();
                    break;
                case "nation":
                    graph_draw.by_nation();
                    break;
                default:
                    graph_draw.by_year();
                    break;
            }
        });
    })