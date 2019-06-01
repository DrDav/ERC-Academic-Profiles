#!/usr/bin/env python

import requests # To make REST requests
import json # To parse the reply from the API
import csv # To read and write csv files
import urllib # To escape the query parameters

from whoswho import who

def find_orcid(csvfile_in, csvfile_out, orcid_url="https://pub.orcid.org/v2.1/"):

    # Open the input and output files
    with open(csvfile_in, encoding="utf-8") as csv_in,\
            open(csvfile_out, "a", encoding="utf-8") as csv_out:

        reader = csv.DictReader(csv_in, delimiter=";");

        # Skip some rows if anything went wrong before
        # [next(reader, None) for item in range(1983)] # -2

        # Fields of the csv output file
        fields_out = ['Nome', 'Cognome', 'Nome Trovato', 'Cognome Trovato', 'Orcid']
        writer = csv.DictWriter(csv_out, fieldnames=fields_out, delimiter=";")

        for row in reader:
            csv_name = row['firstName'].replace("(","").replace(")","").replace(" or ", " ").replace(",","")
            csv_surname = row['lastName'].replace("(","").replace(")","").replace(" or ", " ").replace(",","")

            print("\n" + csv_name + " " + csv_surname)

            # Setup the parameters
            query_param = urllib.parse.quote(csv_name.lower()
                                             + " "
                                             + csv_surname.lower(),
                                             safe="")

            # Make the request to the Orcid API
            #time.sleep(1)
            req = requests.get(orcid_url + "search/?q=" + query_param,
                               headers = {'Accept': 'application/json'})
            # Parse the reply
            obj = json.loads(req.text)
            count = 0
            orcid = ""
            # If there is a result
            if(obj['num-found'] != 0):
                for person in obj['result']: # {result: [], num-found: int}
                    count = count + 1
                    if(count > 5): # Stop after 5 tries
                        break;

                    # Get the details of a person
                    req = requests.get(orcid_url + person['orcid-identifier']['path'] + "/person",
                                       headers = {'Accept': 'application/json'})

                    result = json.loads(req.text)

                    try:
                        result_name = result['name']['given-names']['value']
                        result_surname = result['name']['family-name']['value']
                    except:
                        continue;

                    # If the name strictly matches
                    if(who.match(csv_name + " " + csv_surname,
                        result_name + " " + result_surname)):
                        # Save it
                        orcid = person['orcid-identifier']['path']
                        print(orcid)

                        break #
                
            # Write the results
            if orcid:
                writer.writerow({
                    'Nome': row['firstName'],
                    'Cognome': row['lastName'],
                    'Nome Trovato': result_name,
                    'Cognome Trovato': result_surname,
                    'Orcid': orcid
                    })
            else:
                writer.writerow({
                    'Nome': row['firstName'],
                    'Cognome': row['lastName'],
                    'Nome Trovato': '',
                    'Cognome Trovato': '',
                    'Orcid': ''
                    })


def main():
    find_orcid("persone_organizzazioni_definitivo_senza_duplicati.csv",
            "orcid_definitivo.csv")

if __name__ == "__main__":
    main()

