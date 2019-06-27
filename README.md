# ERC Academic Profiles
This is my project for the exam "Scientific and Large Data Visualization" under the Master Degree in Computer Science at University of Pisa.

This tool aims to visualize how many people involved in the European Research Council programme have a (findable) profile on academic websites such as [Scopus](http://scopus.com) or [Orcid](http://orcid.org), using [D3.js](http://d3js.org). It also shows the main research areas of the winners in the years 2014-2020.

You can use the tool by following [this link](http://drdav.github.io/ERC-Academic-Profiles).

## Dataset
The dataset containing the information about the ERC winners between 2014 and 2020 was retrieved from the [EU Open Data Portal](https://data.europa.eu/euodp/en/data/dataset/cordisH2020projects) (refer to that site to know all the information provided about a person). The data was then used to query the public APIs of [Scopus](https://api.elsevier.com/content/search/author) and [Orcid](https://pub.orcid.org/v2.0/search) to see if there exists (and it is findable with the provided name and surname) a profile for each winner. For the profiles found on Scopus, additional data such as the person's areas of publication has been downloaded and analyzed. 

## Technique used to retrieve the data
The public API of Scopus and Orcid were queried using various Python scripts, filed under the _python_ directory. 
Both the scripts for Scopus and Orcid make use of the package [Whoswho](https://github.com/rliebz/whoswho) to match names, while the Scopus one uses also [Pycountry](https://pypi.org/project/pycountry/) to match people's countries too.
The strategy used is as follows:
1. Query the public API of Scopus/Orcid to look for an author ([Scopus API](https://api.elsevier.com/content/search/author), [Orcid API](https://pub.orcid.org/v2.0/search))
2. Loop through the results (sorted by document count) until whoswho finds a match between the name in the dataset and the name obtained from the APIs.
    * For Orcid another query has to be made to retrieve the name of each person as the first search only returns a list of Orcid IDs.
3. If a match for the name is found, check if the country is the same (the EU dataset contains the short name of a country, such as "IT", while the Scopus APIs provide the full name of a country. Hence the use of the Pycountry package). If yes, we say we matched the current person and we save all his/her details. Otherwise we proceed with the next results.
    * For Orcid this check is not made. See below for more details. 
4. If the name doesn't match or if the search provides no results then a "best match" is attempted i.e., the name from the dataset is split (if the person does have multiple names/surnames in the dataset) and every combination of (name, surname) is tried. If there is a match with a score of at least 65 (out of 100, see [Whoswho Fuzzy Matching](https://github.com/rliebz/whoswho#fuzzy-matching)) and the countries match, then this is claimed to be the person searched. If none of the points described above provide a match, the person is marked as "not found".

The reason behind not checking the country for Orcid is that we have seen experimentally that many Orcid profiles are private and/or incomplete and this would have hindered most of the searches. Also for Orcid we check only the first 5 results, as the result set provided by the APIs is really large and full of useless results after ~5 entries (and this would have drastically increased the running time of the script).

## Results
Generally speaking, the data show that people tend to have a Scopus profile rather than an Orcid one. There is also some confusion with people with two or more names/surnames, as they sometimes omit them resulting in (programmatically) unfindable profiles, as name matching is a hard task. Also few people have linked their Orcid identifier to their Scopus profile. The coverage seems to be not related to the type of grant received, nor with the starting year of a project, as it has a mean of ~80% in each of the two grouping. The results are summarized in the table below.

|||
| - | - |
| **Total People Analyzed** | 4537  |
| **Scopus Profiles Founds**  | 4003  |
| **Orcid Profiles Founds**  | 3339 |
| **Orcid ID Linked to Scopus**  | 1233 |
| **Mean Coverage by Year** | 91.7% (Scopus), 79.3%(Orcid)| 
| **Mean Coverage by Grant** | 88.4% (Scopus), 72.8% (Orcid) |
| **Mean Coverage by Nation** | 88.1% (Scopus), 72.1%(Orcid) |

More in depth:
* The number of Scopus profiles found is higher than the Orcid ones. This can be either because people deliberately chose not to sign up for an Orcid ID (or not to have it public, or not filling it with their details) or because of the mechanism with which the search through API is performed. In fact, while Scopus provides very few and very accurate results for each person searched, Orcid returns a superset of the actual results which contains people with only a similar name without a surname, vice-versa, or even people with a not-so-similar name. So it is possibile that more people actually have an Orcid ID but it was not possibile to find them via an API search. Also not everyone having a profile on Scopus have linked it with their Orcid one.
* When viewing the results grouped [by starting year](http://drdav.github.io/ERC-Academic-Profiles/#starting_year) or [by type of grant](http://drdav.github.io/ERC-Academic-Profiles/#grant), little can be said about the behavior of the coverage, since every group tends to have the same coverage percentage (about 85%). This implies that having a findable profile on these two websites is not correlated with the "age" (in terms of years after getting a PhD) of a person, i.e. younger people don't necessarily have a findable profile with respect to older people. We can just note a peak in coverage of Scopus profiles in the group of Advanced Grants of about 90% and at the same time the negative peak in the Orcid one (about 69%). In the latter view the Orcid coverage sees a slight decrease when going from Starting to Consolidator to Advanced grants.
* The view [by nation](http://drdav.github.io/ERC-Academic-Profiles/#nation) is sorted by the number of winners in each country. In this view the bars directly express the coverage in percentage for each site and for each country. Going from left to right we can see that the bars become more and more faded, as a synonym of how much that data is reliable. The reliability of the data in this view is, in fact, given by how many winners are in a specific country with respect to the country having the most of them, i.e. the nations on the right side of the graph have a very low number of winners (e.g. 1) and this clearly cannot represent the Scopus/Orcid coverage of that nation's researchers. We can see however how the naming "rules" in each country probably have affected the results obtained: speaking of Spain, for instance, we can notice a very low coverage with respect to the other countries (about 64%) and this can be due to the fact that people in Spain have two surnames and often two or more names, but they signed up on Scopus/Orcid with just one of them or even with just one name and one surname. This hinders the automatic lookup of a person, as there is no way to tell if a person with one name and one surname is the same person with, say, three names and two surnames. This reasoning clearly applies to other countries, and it applies also to people using acronyms in their names. In countries where people usually have one name and one surname, such as Italy, the coverage can be very high (even 97% for Scopus and 96% for Orcid).
* Finally, the view of the [subjects areas](http://drdav.github.io/ERC-Academic-Profiles/#subjects) shows the main reaserch areas of ERC winners in each country. This information has been extracted from the Scopus website (which in turn is extracted by the publications of each person), so it is only available for people having a Scopus profile, and the research areas are the ones defined by that site. They have been also manually grouped into macroareas, following the Panels defined by the [European Research Council](https://erc.europa.eu/projects-figures/erc-funded-projects).

## License
The source code for this project is licensed under the MIT License. The graphs created from the results obtained are licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

