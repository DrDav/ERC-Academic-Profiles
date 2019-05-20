# ERC Academic Profiles
This is my project for the exam "Scientific and Large Data Visualization" under the Master Degree in Computer Science at University of Pisa.

This tool aims to visualize how many people involved in the European Research Council programme have a (findable) profile on academic websites such as [Scopus](http://scopus.com) or [Orcid](http://orcid.org), using [D3.js](http://d3js.org).

You can use the tool by following [this link](http://drdav.github.io/ERC-Academic-Profiles).

## Dataset
The dataset containing all the information about the ERC winners between 2014 and 2020 was retrieved from the [EU Open Data Portal](https://data.europa.eu/euodp/en/data/dataset/cordisH2020projects). The data was then used to query the public APIs of the aforementioned sites ([Scopus](https://dev.elsevier.com/api_docs.html), [Orcid](https://pub.orcid.org/v2.0/) to see if there exists a profile for each winner. For the profiles found on Scopus, additional data such as the person's areas of publication has been downloaded and analyzed.

## Results
The data shows that people tends to have a Scopus profile rather than an Orcid one. There is also some confusion with people with 2 or more names/surnames, as they sometimes omit them resulting in unfindable profiles, at least from a programmatic point of view, where name matching is a hard task. Also very few people have attached their Orcid identifier to their Scopus one. The coverage seems to be not related to the type of grant received, nor with the starting year of a project, as it has a mean of ~80% in every visualization proposed.

## Usage
The tool starts by showing a graph that groups people by the year in which their ERC project started. You can then choose any other grouping available, such as by grant type or by nation, or view the distribution of the subject areas for each nation.
The graph shows the comparison between Scopus and Orcid profiles. In the view grouped by nation, the bars have a gradient that tells the reliability of the data (i.e. 100% profile coverage is not very reliable when a nation has a total of 5 ERC winners).

