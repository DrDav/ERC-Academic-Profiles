#!/usr/bin/env python

import csv # To read and write csv files
import json # To parse the reply from the websites
import pycountry # Country abbreviation => full name
import requests # To make REST requests
import time # To sleep
import urllib # To parse the query params

from itertools import islice
from whoswho import who

""" Scopus API request maker. Reads data from one csv file and outputs the results in another csv file. """


def find_people_and_missing(csvfile_in, csvfile_out, fields_out, scopus_url="https://api.elsevier.com/content/search/author?apiKey=4d9c9467316b1e205be7c9cbef6518ad&httpAccept=application%2Fjson&count=1&sort=-document-count,+affiliation-country"):

    """First tries to match strictly the name and the country.
    If this fails, the algoritms tries to find a "best match", that is,
    a person with an almost similar name and the same country.
    Otherwise an empty row is written in the output file."""

    # Open the files for reading and writing
    with open(csvfile_in, encoding="utf-8") as csv_in,\
            open(csvfile_out, "a", encoding="utf-8") as csv_out:

        reader = csv.DictReader(csv_in, delimiter=";")
        writer = csv.DictWriter(csv_out, fieldnames=fields_out, delimiter=";")

        # Skip some lines to resume if previous execution failed at some point
        # [next(reader, None) for item in range(3171)] # -2 

        writer.writeheader()

        # For every person
        for row in reader:
            # Prepare the parameters for the query
            csv_name = row['firstName'].replace(",","").replace(" or ", " ")
            csv_surname = row['lastName'].replace(",","").replace(" or ", " ")
            # Print the current person to keep track of the work
            print(csv_name + " " + csv_surname)
            
            csv_org_name = ""
            csv_org_city = ""
            csv_org_country = pycountry.countries.get(alpha_2=(row['country'].replace("UK","GB").replace("EL","GR")))
            
            if(csv_org_country is not None):
                csv_org_country = csv_org_country.name
            else:
                csv_org_country = row['country']

            # Setup the parameters for the query (escape the strings)
            query_params = ("authlast("
                           + urllib.parse.quote(
                                   csv_surname.lower().replace("(","").replace(")",""), safe="")
                           + ")%20and%20authfirst("
                           + urllib.parse.quote(csv_name.lower().replace("(","").replace(")",""), safe="")
                           + ")")

            # Make the API Request
            time.sleep(1) # Sleep 1 second
            req = requests.get(scopus_url + "&query=" + query_params)
            try:
                obj = json.loads(req.text) # Parse the reply
            except:
                print(req.text)
                return

            # Get the first by doc-count that matches the name
            if(obj['search-results']['opensearch:totalResults'] != '0'):
                for person in obj['search-results']['entry']:
                    result_name = person['preferred-name']['given-name']
                    result_surname = person['preferred-name']['surname']
                    if(not who.match(csv_name + " " + csv_surname,
                        result_name + " " + result_surname)):
                        # If the name does not match, fallback to best_match
                        best_match = find_best_match(row, scopus_url)
                        writer.writerow(best_match)

                    else: # The name matches, fetch the details
                        # ID Scopus
                        try:
                            scopus_id = person['dc:identifier'].replace("AUTHOR_ID:","")
                        except:
                            scopus_id = ""
                            # ID Orcid - not always present
                        try:
                            orcid = person['orcid']
                        except KeyError:
                            orcid = ""
                            
                        num_works = person['document-count']

                        # Fetch the list of subject areas
                        subjects = [] 
                        try:
                            for subj in person['subject-area']:
                                if(len(subjects) == 5): # Max 5 subj areas
                                    break
                                try: 
                                    subjects.append(subj['@abbrev'])
                                except:
                                    continue
                        except KeyError:
                            subjects = []

                        # Name, City and Country of his/her affiliation
                        try:
                            aff_name = person['affiliation-current']['affiliation-name']
                        except KeyError:
                            aff_name = ""
                        try:    
                            aff_city = person['affiliation-current']['affiliation-city']
                        except KeyError:
                            aff_city = ""
                        try:
                            aff_country = person['affiliation-current']['affiliation-country']
                            print(" (" + aff_country + ")")
                        except:
                            aff_country = ""
                            print("()")

                        # Write the result
                        writer.writerow({
                            'Nome': row['firstName'],
                            'Cognome': row['lastName'],
                            'Nome Trovato': result_name,
                            'Cognome Trovato': result_surname,
                            'Pubblicazioni': num_works,
                            'Subject Areas': ",".join(subjects),
                            'Affil. Name CSV': csv_org_name,
                            'Affil. Name Trovato': aff_name,
                            'Affil. City CSV': csv_org_city,
                            'Affil. City Trovato': aff_city,
                            'Affil. Country CSV': csv_org_country,
                            'Affil. Country Trovato': aff_country,
                            'Scopus ID': scopus_id,
                            'Orcid': orcid
                            })
            else:
                # If there aren't any results, try to find the best match
                best_match = find_best_match(row, scopus_url)
                writer.writerow(best_match)


def find_best_match(row, scopus_url):
    """Splits the name and surnames and tries to find some combination
    of them, that still matches the country."""

    # Prepare the parameters
    csv_name = row['firstName'].replace(",","").replace(" or ", " ")
    csv_surname = row['lastName'].replace(",","")
    csv_org_country = row['country'].replace("UK","GB").replace("EL","GR")
    csv_org_name = ""#row['name'] or ""
    csv_org_city = ""#row['city'] or ""

    print("(BEST MATCH) " + csv_name + " " + csv_surname + " (" + csv_org_country + ")")

    # Split the name and surname
    names = csv_name.split()
    surnames = csv_surname.split()

    best_match = {
            'Nome': row['firstName'],
            'Cognome': row['lastName'],
            'Nome Trovato': "",
            'Cognome Trovato': "",
            'Pubblicazioni': "",
            'Subject Areas': "",
            'Affil. Name CSV': "",
            'Affil. Name Trovato': "",
            'Affil. City CSV': "",
            'Affil. City Trovato': "",
            'Affil. Country CSV': pycountry.countries.get(alpha_2=csv_org_country).name,
            'Affil. Country Trovato': "",
            'Scopus ID': "",
            'Orcid': ""
            }

    # Try every combination of a name and a surname
    for name in names:
        for surname in surnames:
            # Setup the query params (escape the strings)
            query_params = ("authlast("
                    + urllib.parse.quote(surname.lower().replace("(","").replace(")",""), safe="")
                    + ")%20and%20authfirst("
                    + urllib.parse.quote(name.lower().replace("(","").replace(")",""), safe="")
                    + ")")

            # Make the request
            req = requests.get(scopus_url + "&query=" + query_params)
            obj = json.loads(req.text)
            try:
                obj['search-results']['opensearch:totalResults']
            except:
                print(obj)
                print(query_params)
                return
            #return

            # 
            if(obj['search-results']['opensearch:totalResults'] != '0'):
                for person in obj['search-results']['entry']:
                    result_name = person['preferred-name']['given-name']
                    result_surname = person['preferred-name']['surname']
                    # ID Scopus
                    try:
                        scopus_id = person['dc:identifier'].replace("AUTHOR_ID:","")
                    except:
                        scopus_id = ""
                    try:
                        orcid = person['orcid']
                    except KeyError:
                        orcid = ""
                    
                    num_works = person['document-count']
                    subjects = []
                    try:
                        for subj in person['subject-area']:
                            if(len(subjects) == 5):
                                break
                            try: 
                                subjects.append(subj['@abbrev'])
                            except:
                                continue
                    except KeyError:
                        subjects = []

                    # If the name matches with a score >= 65 (less strict)
                    if(who.ratio(csv_name + " " + csv_surname, result_name + " " + result_surname) >= 65):
                        print("\t" + result_name + " " + result_surname,end="")
                        country = pycountry.countries.get(alpha_2=csv_org_country)
                        try:
                            aff_name = person['affiliation-current']['affiliation-name']
                        except KeyError:
                            aff_name = ""
                        try:    
                            aff_city = person['affiliation-current']['affiliation-city']
                        except KeyError:
                            aff_city = ""
                        try:
                            aff_country = person['affiliation-current']['affiliation-country']
                            print(" (" + aff_country + ")")
                        except:
                            aff_country = ""
                            print("()")

                        # If the country matches, we pick this person
                        if(aff_country and aff_country.lower() == country.name.lower()):
                            return ({
                                'Nome': row['firstName'],
                                'Cognome': row['lastName'],
                                'Nome Trovato': result_name,
                                'Cognome Trovato': result_surname,
                                'Pubblicazioni': num_works,
                                'Subject Areas': ",".join(subjects),
                                'Affil. Name CSV': csv_org_name,
                                'Affil. Name Trovato': aff_name,
                                'Affil. City CSV': csv_org_city,
                                'Affil. City Trovato': aff_city,
                                'Affil. Country CSV': country.name,
                                'Affil. Country Trovato': aff_country,
                                'Scopus ID': scopus_id,
                                'Orcid': orcid
                                })
                            
    return best_match                       


def main():
    # Fields of the csv output
    fields = [
             'Nome', # Dataset
             'Cognome', # Dataset
             'Nome Trovato', # Scopus
             'Cognome Trovato', # Scopus
             'Pubblicazioni', # Scopus
             'Subject Areas', # Scopus
             'Affil. Name CSV', # Dataset
             'Affil. Name Trovato', # Scopus
             'Affil. City CSV', # Dataset
             'Affil. City Trovato', # Scopus
             'Affil. Country CSV', # Dataset
             'Affil. Country Trovato', # Scopus
             'Scopus ID', # Scopus
             'Orcid' # Scopus
             ]

    find_people_and_missing("persone_organizzazioni_definitivo_senza_duplicati.csv",
            "scopus_data.csv",
            fields)
            

if __name__ == "__main__":
    main()
