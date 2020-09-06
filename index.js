let lignesTram = document.getElementById('lignesTram');
let directionTram = document.getElementById('directionTram');
let arretsTram = document.getElementById('arretsTram');
let horrairesTram = document.getElementById('horrairesTram');
let carteTram = document.getElementById('carteTram');

/*{transport_id: {
	type: http://data.metromobilite.fr/api/routers/default/index/routes
	line_color: http://data.metromobilite.fr/api/routers/default/index/routes
	route: https://data.metromobilite.fr/api/lines/json?types=ligne&codes={transport_id}	
	schedule: https://data.metromobilite.fr/api/ficheHoraires/json?route={transport_id}
}}
*/

function convert(t) {
    
    hours = Math.floor(t / 3600);
    mins = Math.floor((t - hours*3600) / 60);
	if (hours < 10) {
		hours = '0' + hours.toString();
	}
	else {
		hours = hours.toString();
	}
	if (mins < 10) {
		mins = '0' + mins.toString();
	}
	else {
		mins = mins.toString();
	}
    return hours + ":" + mins;
    
}


const urlLignes = 'http://data.metromobilite.fr/api/routers/default/index/routes';

let all_data = {};

fetch(urlLignes).then (function(response){ 
    return response.json();  
})

.then (function (data){

        for(let i = 0; i < data.length; i++){
            let nomDeLigneLongue = data[i].longName; //mes variables
            let nomDeLigneCourte = data[i].shortName;
            let couleurLigne = data[i].color;
            let typeDeLigne = data[i].type;
			
			all_data[data[i].id] = {'id': data[i].id, 'line_color': couleurLigne, 'long_name': nomDeLigneLongue, 'short_name': nomDeLigneCourte};
			
			switch(typeDeLigne) {

                case 'TRAM' :
                     all_data[data[i].id].type = 'Tram';
                     break;

                case 'SNC' :
                    all_data[data[i].id].type = 'Train';
                    break;

                case 'FLEXO' , 'Structurantes' , 'Urbaines' , 'Interurbaines':
                    all_data[data[i].id].type = 'Bus';
                    break;

                case 'C38' : 
                    all_data[data[i].id].type = 'BusExpress';
                    break;

                case 'SCOL' :
					all_data[data[i].id].type = 'BusScolaires';
                    break;

            } //fin de switch

			let route = 'https://data.metromobilite.fr/api/lines/json?types=ligne&codes=' + data[i].id;
			fetch(route).then (function(response){ 
				return response.json();  
			})
			.then (function(_data) {
				all_data[data[i].id].route = _data['features'][0];
			});
			
			let schedule = 'https://data.metromobilite.fr/api/ficheHoraires/json?route=' + data[i].id;
			fetch(schedule).then (function(response){ 
				return response.json();  
			})
			.then (function(_data) {
				all_data[data[i].id].schedule = _data[0]['arrets'].map((arret) =>  {
						delete arret.parentStation;
						delete arret.lat;
						delete arret.lon;
						for (let i in arret.trips) {
							arret.trips[i] = convert(arret.trips[i]);
						}
						
						return arret;
					});
			});

           // console.log(data[i]);

        //lignesTram.innerHTML = nomDeLigneCourte; 
        //console.log (nomDeLigneCourte)
    } // fin de la boucle
   
    //Выводим кнопки на все трамваи
	all_trams = Object.values(all_data).filter(transport => {return transport.type == 'Tram'}) //объект со всеми данными превращаем в массив и фильтруем по типу (выбираем только трамваи);
	//console.log(all_trams);
	
	let div_tram = document.getElementById('lignesTram');
	for (let i in all_trams) {
		//all_trams[i].short_name
		let tram = document.createElement('button');
		tram.setAttribute('id', all_trams[i].id);
		tram.setAttribute('class', 'show_info');
		tram.innerHTML = all_trams[i].short_name;
		div_tram.appendChild(tram);
	}
	

			let map = L.map('carteTram').setView([45.1885, 5.7245], 13);
			
			L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=vt5fJPuY3rmHAQVuU320', {
					attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
			}).addTo(map);

			layerGroup = new L.LayerGroup();
			layerGroup.addTo(map);	
	
	let tram_buttons = document.getElementsByClassName('show_info');
	for (let i in tram_buttons) {
		tram_buttons[i].addEventListener('click', function(e) {
			let div_direction = document.getElementById('directionTram');
			let t = all_data[e.target.id]; //current transport
			
			div_direction.innerHTML = t.long_name;
			
			/*let div_arrets = document.getElementById('arretsTram');
			div_arrets.innerHTML = '';
			let arrets = all_data[e.target.id].schedule.map(arret => { return arret.stopName });
			let ul = div_arrets.appendChild(document.createElement('ul'));
			
			for (i in arrets) {
				let li = ul.appendChild(document.createElement('li'));
				li.innerHTML = arrets[i];
			}*/
			
			let div_schedule = document.getElementById('horrairesTram');
			let table = document.createElement('table');
			for (i in t.schedule) {
				//t.schedule[i].stopName
				//t.schedule[i].trips
				let tr = document.createElement('tr');
				table.appendChild(tr);
				
				let td_stopname = document.createElement('td');
				td_stopname.innerHTML = t.schedule[i].stopName;
				tr.appendChild(td_stopname);
				
				let td_trips = document.createElement('td');
				td_trips.innerHTML = t.schedule[i].trips.join(', ');
				tr.appendChild(td_trips);
			}
			div_schedule.innerHTML = '';
			div_schedule.appendChild(table);
			
			layerGroup.clearLayers();
			route = L.geoJSON().addTo(map);
			route.addData(t.route);
			layerGroup.addLayer(route);
		});
	}
	
	
	
 //   console.log(all_data);
}); 

