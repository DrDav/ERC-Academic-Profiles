var w = window,
d = document,
e = d.documentElement,
g = d.getElementsByTagName('body')[0],
winWidth = w.innerWidth || e.clientWidth || g.clientWidth,
winHeight = w.innerHeight|| e.clientHeight|| g.clientHeight;
// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 40};
var width = winWidth - margin.left - margin.right;
var height  = winHeight - margin.top - margin.bottom;
var spaceBetween = 10;

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
.append("g")
    .attr("transform", 
        "translate(" + margin.left + "," + margin.top + ")");

// get the data
d3.csv("data/starting_years.csv").then(function(data) {

    // set the ranges
    var x = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return d.starting_year} ), d3.max(data, function(d) { return d.starting_year})])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([0, 100 + parseInt(d3.max(data, function(d) { return d.scopus_profiles; }))])
        .range([height, 0]);

    // Prepare the histogram
    var histogram = d3.histogram()
        .value(function(d) {return parseInt(d.starting_year); }) // x values
        .domain(x.domain())
        .thresholds(x.ticks(7));

    console.log(data);
    var bins = histogram(data);
    console.log(bins);

    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 1)
        .attr("transform", function(d) {
            return "translate(" + (x(d.x0) + spaceBetween) + "," + y(d[0].scopus_profiles) + ")"; })
        .attr("width", function(d) { return Math.max(x(d.x1) - x(d.x0) - spaceBetween * 2, 0); })
        .attr("height", function(d) { return height - y(parseInt(d[0].scopus_profiles)); });

    // add the x Axis
    var xAxis = d3.axisBottom(x).tickFormat(d3.format(".0f")).tickValues([2014, 2015, 2016, 2017, 2018, 2019, 2020]);
    var colWidth = Math.floor(x(x.ticks(xAxis.ticks()[0])[1]) - x(x.ticks(xAxis.ticks()[0])[0])) - 1;

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        /* Move the labels at the center of the bars */
        .selectAll("text")
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + colWidth + ", 0)")


    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
});
