'use strict';

import idb from './main-idb.js';

/**
 * Common database helper functions.
 */

export class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        return 'https://frest.glitch.me';
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callbackArray) {
        fetch(this.DATABASE_URL+'/restaurants').then(response => response.json())
            .then(restaurants => {
                idb.insert('restaurants', restaurants);
                callbackArray.forEach( fx => {
                    fx();
                });
            }).catch(e => {
                toastr.error(`Error getting the list of restaurants ${e}`);
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        idb.selectAll(restaurants => {
            let restaurant = restaurants.filter(r => r.id == id)[0];
            callback(null, restaurant);
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        idb.selectAll( restaurants => {
            restaurants.filter(r => r.cuisine_type === cuisine);
            callback(null, restaurants);
        })
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        idb.selectAll( restaurants => {
            restaurants.filter(r => r.neighborhood === neighborhood);
            callback(null, restaurants);
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        idb.selectAll( restaurants =>  {
            if (cuisine !== 'all') { // filter by cuisine
                restaurants = restaurants.filter(r => r.cuisine_type === cuisine);
            }
            if (neighborhood !== 'all') { // filter by neighborhood
                restaurants = restaurants.filter(r => r.neighborhood === neighborhood);
            }
            callback(null, restaurants);
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        idb.selectAll( restaurants => {
            const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
            const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
            callback(null, uniqueNeighborhoods);
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        idb.selectAll( restaurants => {
            let cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
            // Remove duplicates from cuisines
            let uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
            callback(null, uniqueCuisines);
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        if(restaurant.photograph !== undefined)
            return (`/img/${restaurant.photograph}.jpg`);
        else
            return ('/img/placeholder.png');
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        let marker = L.marker(restaurant.latlng).addTo(map);
        marker.bindPopup(`${restaurant.name} <br> <a href="${DBHelper.urlForRestaurant(restaurant)}">More info</a>`).openPopup();
        return marker;
    }

    static insertReview(data, callback){
        fetch(`${this.DATABASE_URL}/reviews`, {
            body: JSON.stringify(data),
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            }
        })
        .then( response => response.json())
        .then( res => {
            callback(res);
        }).catch( e => {
            console.error(e);
            toastr.warning('You seem to be offline, we will try post the review later');
            idb.insert('pending_request', data);
        });
    }

    static checkPendingRequests(){
        idb.getPendingRequests( pendingReview => {
            console.log('pendingReview', pendingReview);
            this.insertReview(pendingReview, () => {
                toastr.success('Pending offline review posted');
                idb.removeKey('pending_request');
            });
        });
    }

}