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

function buildLegendForSubjects(svg, colors) {
    // 27 subj areas => 3 gruppi
    var keys = colors.domain()
    var firstGroup = keys.slice(0, 9);
    var secondGroup = keys.slice(9, 18);
    var thirdGroup = keys.slice(18, 27);
    var distance = 25;

    /* First Group */
    var g1 = svg.append("g").attr("transform", "translate(0, 14)").selectAll("g.legend")
    .data(firstGroup).enter().append("g")

    g1.append("rect")
    .attr("x", graph_params.innerWidth - graph_params.margin.left - 190)
    .attr("y", (d, i) => distance * i )
    .attr("width", 13)
    .attr("height", 13)
    .attr("fill", (d) => colors(d))

    g1.append("text")
    .attr("x", graph_params.innerWidth - graph_params.margin.left - 170)
    .attr("y", (d, i) => distance * i + 11)
    .attr("class", "label")
    .text((d) => d)

    /* Second Group */
    var g2 = svg.append("g").attr("transform", "translate(0, 14)").selectAll("g.legend")
    .data(secondGroup).enter().append("g")

    g2.append("rect")
    .attr("x", graph_params.innerWidth - graph_params.margin.left - 110)
    .attr("y", (d, i) => distance * i )
    .attr("width", 13)
    .attr("height", 13)
    .attr("fill", (d) => colors(d))

    g2.append("text")
    .attr("x", graph_params.innerWidth - graph_params.margin.left - 90)
    .attr("y", (d, i) => distance * i + 11)
    .attr("class", "label")
    .text((d) => d)

    /* Third Group */
    var g3 = svg.append("g").attr("transform", "translate(0, 14)").selectAll("g.legend")
    .data(thirdGroup).enter().append("g")

    g3.append("rect")
    .attr("x", graph_params.innerWidth - graph_params.margin.left - 30)
    .attr("y", (d, i) => distance * i )
    .attr("width", 13)
    .attr("height", 13)
    .attr("fill", (d) => colors(d))

    g3.append("text")
    .attr("x", graph_params.innerWidth - graph_params.margin.left - 10)
    .attr("y", (d, i) => distance * i + 11)
    .attr("class", "label")

    .text((d) => d)
}

function updateExplanation(subjAreasGrouped = true) {
    var textYear = "<p>The bars show how many ERC-winning people have a Scopus and/or Orcid profile, grouped by the year in which they have started their EU project.</p>\
    <p>Solid-colored columns represent Scopus profiles, while a diagonal pattern overlay is used for Orcid's. Grey bars show the total number of people that started in a given year.</p>\
    <p>The columns are subsequently divided by type of project, namely Starting Grants, Consolidator Grants, Advanced Grants or Proofs of Concept.</p>\
    <p>We can see that the starting year does not affect in any particular way the coverage of the profiles, i.e., the coverage is almost the same for each site and each year.</p>";

    var textGrant = "<p>The bars show how many ERC-winning people have a Scopus and/or Orcid profile, grouped by the type of grant they have received from the EU.</p>\
    <p>Solid-colored columns represent Scopus profiles, while a diagonal pattern overlay is used for Orcid's. Grey bars show the total number of people that have received a grant of a given type.</p>\
    <p>The columns are subsequently divided by the year in which their project started.</p>\
    <p>From this point of view we cannot notice much variance between groups in terms of coverage. However we can see that the percentage is a little higher for the Advanced grants, although not much. So the coverage seems to be independent from the type of grant one receives.</p>";

    var textNation = "<p>In this view the profiles found are shown in percentage (i.e. the coverage of the profiles with respect to the total winners in a nation).</p>\
    <p>The bars have a gradient that visually tells the statistical relevance of the obtained data. The more faded a bar, the lesser the relevance.</p>\
    <p>For example, consider a Nation such as the United Kingdom: it has a large number of grants, and a Scopus coverage of about 86%. This is much more reliable than a coverage of 100% found in a nation with 1 grant only, such as Lithuania, where little can be said about its researchers.</p>\
    <p>For this reason, the bars associated with Lithuania are more faded than the ones of UK.</p>\
    <p>This view clearly shows one of the main issues with academic profile finding: in fact the variance in coverage is very high with respect to nations.\
    This is because of the \"naming rules\" each country has, for example in Spain people has two surnames but not everyone in Spain has a profile with all his/her names and surnames.</p>\
    <p>There exist some people that have signed up for a profile with only one of their names or surnames (this applies for almost all the countries analyzed).\
    This fact renders the lookup of a person very difficult under a programmatic point of view, as name matching has always been a hard task to solve and having profiles with variations of names contributes to increase the difficulty of it.</p>";

    var textSubject = "<p>This view shows the distribution of the (main) research areas of ERC winners divided by nation.</p>\
    <p>These results come from the Scopus website, and the areas are the ones defined by it.</p>\
    <p>Hover on the legend of the chart to see the meaning of each area. You can click on the legend to sort the bars according to a particular subject area. By default bars are sorted by total people in each country.</p>";

    var textSubjectGrouped = "<p>This view shows the distribution of the (main) research areas of ERC winners divided by nation.</p>\
    <p>The results come from the Scopus website, but the areas are grouped according to the <a href=\"https://erc.europa.eu/projects-figures/erc-funded-projects\" alt=\"ERC Research Domains\" style=\"color: blue;\">ERC-defined Research Domains</a> (or Panels).</p>\
    <p>Hover on the chart legend to see the meaning of each group.</p>\
    <p>Click on the chart legend to sort the bars by a subject area. By default bars are sorted by total people in each country.";
    var div = d3.select(".explanation")
    switch(graph_params.group) {
        case "grant":
            div.html(textGrant)
            break;
        case "nation":
            div.html(textNation)
            break;
        case "subjects":
            div.html((subjAreasGrouped) ? textSubjectGrouped : textSubject)
            break;
        default:
            div.html(textYear)
            break;
    }
}

const subjDescriptions = {
    'SH': "Social Sciences and Humanities",
    'PE': "Physical Sciences and Engineering",
    'LS': "Life Sciences",
    'AGRI': "Agricultural and Biological Sciences",
    'ARTS': "Arts and Humanities",
    'BIOC': "Biochemistry, Genetics and Molecular Biology",
    'BUSI': "Business, Management and Accounting",
    'CENG': "Chemical Engineering",
    'CHEM': "Chemistry",
    'COMP': "Computer Science",
    'DECI': "Decision Sciences",
    'DENT': "Dentistry",
    'EART': "Earth and Planetary Sciences",
    'ECON': "Economics, Econometrics and Finance",
    'ENER': "Energy",
    'ENGI': "Engineering",
    'ENVI': "Environmental Science",
    'HEAL': "Health Professions",
    'IMMU': "Immunology and Microbiology",
    'MATE': "Materials Science",
    'MATH': "Mathematics",
    'MEDI': "Medicine",
    'NEUR': "Neuroscience",
    'NURS': "Nursing",
    'PHAR': "Pharmacology, Toxicology and Pharmaceutics",
    'PHYS': "Physics and Astronomy",
    'PSYC': "Psychology",
    'SOCI': "Social Sciences",
    'VETE': "Veterinary",
    'MULT': "Multidisciplinary"
}

function appendLegendLabels() {
    d3.selectAll(".label").on("mousemove", function() {
        var key = d3.event.target.innerHTML;
        //console.log(d3.event.target);
        d3.select(".tooltip")
            .style("left",  (d3.event.pageX - 70) + "px")
            .style("top", d3.event.pageY - 70 + "px")
            .style("display", "inline-block")
            .text(subjDescriptions[key]);
    })
    .on("mouseout", function() {
        d3.select(".tooltip").style("display", "none");
    })
}