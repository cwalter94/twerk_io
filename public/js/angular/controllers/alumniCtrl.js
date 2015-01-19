var alumniCtrl = app.controller('alumniCtrl', function($scope, $http, $location, flash, $state, $animate) {
    $animate.enabled(false);

    $scope.formData = {};
    $scope.carInterval = 10000;
    $scope.slides = [
        {
            name: 'Benito Delgado-Olson',
            img: '/img/benito.jpg',
            description: 'Benito Delgado-Olson (’07) is the cofounder and Executive Director of K to College, ' +
                'a Bay Area nonprofit who’s mission is to promote equal access to education by ensuring every student ' +
                'has the resources and tools to learn from kindergarden to college. As a native of the East Bay and ' +
                'graduate of several East Bay public schools, Benito has a lifelong interest in the ' +
                'nonprofit sector and education. Benito graduated with a double major from Berkeley in 2007.',

            description2: 'During his senior year, he founded the student group that would eventually ' +
                'evolve into present day K to College. ' +
                'Since its inception, Benito has recruited a professional board of directors, ' +
                'designed, developed and implemented the proven K to College business model, secured ' +
                'both public and private partnerships at the state and local level and raised several ' +
                'million dollars for program operations. '
        },
        {
            name: 'Sean Ahrens',
            img: '/img/seanahrens.jpg',
            description: "Sean Ahrens ('08) is the cofounder of Crohnology, a patient-powered research network " +
                "that allows any patient to contribute to research for their condition. " +
                "At the age of 12, Sean was diagnosed with Crohn’s Disease, an incurable autoimmune condition " +
                "of the digestive tract. Sean has since made it his life’s mission to cure this disease by connecting " +
                "the world’s patients and empowering collective research toward a solution. " +
                "Sean is a two-time Y-Combinator, Rock Health, and UC Berkeley alum. As a programmer and software designer, " +
                "he has been a founder of, or early hire at, six different SF tech startups. Sean studied " +
                "Computer Science and Business during his time at UC Berkeley, and is the subject of two " +
                "documentaries on how technology is revolutionizing medicine.  He currently lives in San Francisco, CA."

        },
        {
            name: 'Daniel Zayas',
            img: '/img/dz3.jpg',
            description: 'Daniel Zayas (’12) is currently a Project Analyst for the Rio 2016 Olympic games in Brazil.' +
                ' Daniel majored in Civil Engineering and graduated first in his class in the department. ' +
                'Throughout his time at UC Berkeley Daniel was involved in numerous on-campus organizations ' +
                'including Steel Bridge and Club Soccer.'
        }
    ]

    $scope.verifyEmail = function() {

    }
});
