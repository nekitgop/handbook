(function () {

    // Query urls
    var countryServiceUrl = 'http://localhost:8080/services/reference/country/getList.do',
        cityServiceUrl = 'http://localhost:8080/services/reference/city/getList.do';

/*    var countryServiceUrl = 'test.php',
        cityServiceUrl = 'citiestest.php';*/


    $(function () {
        var countries = new Service({
            url:countryServiceUrl,
            onComplete:function (countries) {

                var display = new Display({
                    data:countries,
                    columnContainer:$('#countriesColumns'),
                    columnsNum:4,
                    eachColumn:function () {

                        display.column = $('<div class="referenceColumn"></div>').appendTo(display.options.columnContainer);

                    },
                    eachCountry:function (country) {

                        $('<h3>' + country.name + '</h3>').appendTo(display.column);

                        var cities = new Service({
                            url:cityServiceUrl,
                            params:{country:country.name},
                            onComplete:function (cities) {
                                cities.sort(display.sortByName);
                                display.citiesIterator(cities)
                            }
                        });

                        cities.getList();

                    },
                    eachCities:function (citiy) {

                        var name = $('<p><a>' + citiy.name + '</a>&nbsp;</p>')
                            .appendTo(display.column);
                        $('<span class="airCode">' + display.insertExisting(citiy.code, citiy.codeIATA) + '</span>')
                            .appendTo(name)

                    }

                });

                display.options.data.sort(display.sortByName)
                display.columnIterator();
                display.countryIterator();
            }
        });
        countries.getList();

    });


    function Display(arguments) {

        this.options = arguments;

        this.columnsStack = Math.ceil(this.options.data.length / this.options.columnsNum);
        this.dataCounter = 0;
        this.stack = 0
    }

    Display.prototype = {
        columnIterator:function () {
            if (this.options.eachColumn) this.options.eachColumn(this);

        },
        countryIterator:function () {
            if (this.stack >= this.columnsStack) {
                this.stack = 0;
                this.columnIterator();
            }
            this.options.eachCountry(this.options.data[this.dataCounter]);
            this.dataCounter++;
            this.stack++

        },
        citiesIterator:function (cities) {
            for (var i = 0; i < cities.length; i++) {
                this.options.eachCities(cities[i])
            }
            this.dataCounter < this.options.data.length ? this.countryIterator() : true

        },
        insertExisting:function () {
            var existArray = [];
            for (var prop in arguments) {
                if (arguments[prop] != undefined) existArray.push(arguments[prop])
            }
            return existArray.join(', ');

        },
        sortByName:function (a, b) {
            return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;

        }
    };


    // Service work class
    function Service(arg) {
        this.url = arg.url;
        this.params = arg.params;
        this.onComplete = arg.onComplete;


        this.pageCount = {
            pagesLength:1,
            current:1
        };

        this.list = []
    }

    Service.prototype = {

        getList:function () {
            var query = {pageNum:this.pageCount.current};
            if (this.params) query = $.extend(query, this.params);

            // call to service
            $.ajax({
                type:'GET',
                url:this.url,
                data:query,
                success:inContext(this, this.onsuccess),
                error:inContext(this, this.onerror)
            })
        },
        onerror:function (error) {
            return true
        },
        onsuccess:function (data) {
            var jsonObj = $.parseJSON(data);
            if (jsonObj && jsonObj instanceof Object) {
                this.list = this.list.concat(jsonObj.list);
            } else {
                this.onComplete(this.list);
            }

            if (jsonObj.pagesCount) {
                this.pageCount.pagesLength = jsonObj.pagesCount;
            }

            if (this.pageCount.current < this.pageCount.pagesLength) {
                this.pageCount.current++;
                this.getList()
            } else {
                this.onComplete(this.list)
            }
        }
    };

    // For call async handler in object context
    function inContext(object, fnc) {
        return function () {
            return fnc.apply(object, arguments)
        }
    }
})();