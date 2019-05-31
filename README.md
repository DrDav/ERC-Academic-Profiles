# ERC Academic Profiles
This is my project for the exam "Scientific and Large Data Visualization" under the Master Degree in Computer Science at University of Pisa.

This tool aims to visualize how many people involved in the European Research Council programme have a (findable) profile on academic websites such as [Scopus](http://scopus.com) or [Orcid](http://orcid.org), using [D3.js](http://d3js.org). It also shows the main research areas of the winners in the years 2014-2020.

You can use the tool by following [this link](http://drdav.github.io/ERC-Academic-Profiles).

## Dataset
The dataset containing all the information about the ERC winners between 2014 and 2020 was retrieved from the [EU Open Data Portal](https://data.europa.eu/euodp/en/data/dataset/cordisH2020projects) (refer to that site to know all the information provided about a person). The data was then used to query the public APIs of the aforementioned sites to see if there exists a profile for each winner. For the profiles found on Scopus, additional data such as the person's areas of publication has been downloaded and analyzed. 

## Algorithm used to retrieve the data
The public API of Scopus and Orcid were queried using various Python scripts which are filed under the _python_ directory. 
Both the scripts for Scopus and Orcid make use of the package [Whoswho](https://github.com/rliebz/whoswho) to match names, while the Scopus one uses also [Pycountry](https://pypi.org/project/pycountry/) to match people's countries too.
The idea of the algorithm is as follows:
1. Query the public API of Scopus/Orcid to look for an author ([Scopus API](https://api.elsevier.com/content/search/author), [Orcid API](https://pub.orcid.org/v2.0/search))
2. Loop through the results (sorted by document count) until whoswho finds a match between the name in the dataset and the name obtained from the APIs.
    * For Orcid another query has to be made to retrieve the name of each person as the first search only returns a list of Orcid IDs.
3. If a match for the name is found, check if the country is the same (the dataset contains the short name of a country, such as "IT", while the Scopus APIs provide the full name of a country. Hence the use of the Pycountry package). If yes, we say we matched the current person and we save all his/her details. Otherwise we proceed with the next results.
    * For Orcid this check is not made. See below for more details. 
4. If the name doesn't match or if the search provides no results then a "best match" is attempted i.e., the name from the dataset is split (if the person does have multiple names/surnames in the dataset) and every combination of (name, surname) is tried. If there is a match with a score of at least 65 (out of 100, see [Whoswho Fuzzy Matching](https://github.com/rliebz/whoswho#fuzzy-matching)) and the countries match, then this is claimed to be the person searched. If none of the techniques described above provide a match, the person is marked as "not found".

The reason behind not checking the country for Orcid is that we have seen experimentally that many Orcid profiles are private and/or incomplete and this would have hindered most of the searches. Also for Orcid we check only the first 5 results, as the result set provided by the APIs is really large and full of useless results after ~5 entries (and this would have drastically increased the running time of the script).

## Results
The data shows that people tends to have a Scopus profile rather than an Orcid one. There is also some confusion with people with 2 or more names/surnames, as they sometimes omit them resulting in unfindable profiles, at least from a programmatic point of view, where name matching is a hard task. Also very few people have attached their Orcid identifier to their Scopus one. The coverage seems to be not related to the type of grant received, nor with the starting year of a project, as it has a mean of ~80% in every visualization proposed.
Please refer to the [live site](http://drdav.github.io/ERC-Academic-Profiles) for additional details and comments about the results obtained.

## Usage
The tool starts by showing a graph that groups people by the year in which their ERC project started. You can then choose any other grouping available, such as by grant type or by nation, or view the distribution of the subject areas for each nation.
The graph shows the comparison between Scopus and Orcid profiles. In the view grouped by nation, the bars have a gradient that tells the reliability of the data (i.e. 100% profile coverage is not very reliable when a nation has a total of 5 ERC winners). 

## License
The source code for this project is licensed under the MIT License. The graphs created from the results obtained are licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

