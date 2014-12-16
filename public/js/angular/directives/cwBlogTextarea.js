app.directive('cwBlogTextarea', function() {
    function link (scope, element, attrs) {

        element.on('keydown', function(e) {
            console.log(element);
            console.log(e);

            if (e.keyCode == 9) {
                var domElement = element[0];
                console.log(domElement);
                e.preventDefault();
                var start = domElement.selectionStart;
                var end = domElement.selectionEnd;

                // set textarea value to: text before caret + tab + text after caret
                domElement.val(domElement.val().substring(0, start)
                    + "\t"
                    + domElement.val().substring(end));

                // put caret at right position again
                domElement.selectionStart =
                    domElement.selectionEnd = start + 1;
            }

        });
    }


    return {
        restrict: 'E',
        template: '<textarea> {{text}} </textarea>',
        scope: {
            text: '='
        },
        link: link
    }
});