var accountCtrl = app.controller('accountCtrl', function($scope, $upload, $http, $location, me, flash, $cookieStore, principal, siteSocket) {

    $scope.me = me;
    $scope.me.selectedClasses = [];

    $scope.allClasses = [];
    $scope.loadingClasses = [{departmentCode: 'Loading classes...', courseNumber: ''}];
    $scope.courseSearch = {departments: [], selectedDepartment: "", courses: [], selectedCourse: ""};
    $http({
        url: '/api/departments',
        method: 'GET'
    }).success(function(data) {
        $scope.courseSearch.departments = data.departments;
    });

    $scope.origMe = angular.copy($scope.me);
    $scope.initialComparison = !angular.equals($scope.me, $scope.origMe);
    $scope.dataHasChanged = angular.copy($scope.initialComparison);

    $scope.dropSupported = true;
    $scope.disabled = undefined;

    $scope.search = "";

    $scope.$watch('me', function(newval, oldval) {
       if (newval != oldval) {
           $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
       }
    }, true);

    $scope.$watch('courseSearch.selectedDepartment', function(newval, oldval) {
        if (newval != "") {
            $scope.getCoursesForDepartment(newval);
        }
    });

    $scope.addCourse = function() {
        $scope.me.classes.push($scope.courseSearch.selectedCourse);
        $scope.courseSearch.selectedCourse = "";
    };

    $scope.getCoursesForDepartment = function(selectedDepartment) {
            $http({
                url: '/api/courses',
                method: 'GET',
                params: {
                    department: selectedDepartment
                }
            }).success(function(data) {
                $scope.courseSearch.courses = data.courses;
            })

    };


    $scope.deletePicture = function() {
        $http({
            url: '/api/user/deletepicture',
            method: 'GET'
        }).success(function(data) {
            $scope.origMe.picture = data.picture;
            $scope.me.picture = data.picture;
            $scope.dataHasChanged = angular.equals($scope.me, $scope.origMe);
        }).error(function(err) {
            flash.err = err;
        });
    };

    $scope.removeClass = function(className) {
        var index = $scope.me.classes.indexOf(className);
        $scope.me.classes.splice(index, 1);
    };

    $scope.resetSearchInput = function($select) {
        $select.search = "";
        $scope.search = "";
    };


    $scope.processForm = function() {
        $http.post('/api/userprofile', {data: $scope.me})
            .success(function(response) {
                if ($scope.origMe.status != $scope.me.status) {
                    siteSocket.emit('update:status', {userId: $scope.me._id, status: $scope.me.status, statusCreated: Date.now()})
                }
                $scope.origMe = angular.copy($scope.me);
                $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
                principal.updateIdentity($scope.me);
                flash.success = 'Profile saved.';

            })
            .error(function () {
                flash.error = 'Profile could not be saved. Please try again later.';
            });

    };


    $scope.onFileSelect = function($files) {
        //$files: an array of files selected, each file has name, size, and type.
        for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            $scope.upload = $upload.upload({
                url: '/api/userpicture', //upload.php script, node.js route, or servlet url
                method: 'POST',
//                headers: {'x-csrf-token': $scope.me.csrf},
                // withCredentials: true,
                //data: {_csrf: $scope.me.csrf},
                file: file // or list of files ($files) for html5 only
                //fileName: user.email + '.jpg' // to modify the name of the file(s)
                // customize file formData name ('Content-Disposition'), server side file variable name.
                //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                //formDataAppender: function(formData, key, val){}
            }).progress(function(evt) {
//                console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
            }).success(function(data, status, headers, config) {
                // file is uploaded successfully
                $scope.me.picture = data.picture;
                $scope.origMe = angular.copy($scope.me);
                $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
                flash.success = 'Picture successfully uploaded.';
            })
            .error(function(err) {
                    flash.error = err;
                });
            //.then(success, error, progress);
            // access or attach event listeners to the underlying XMLHttpRequest.
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        }
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
    };
});
