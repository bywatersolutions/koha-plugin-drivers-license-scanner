package Koha::Plugin::Com::ByWaterSolutions::DLScanner;

## It's good practive to use Modern::Perl
use Modern::Perl;

## Required for all plugins
use base qw(Koha::Plugins::Base);

## Here we set our plugin version
our $VERSION = "1.0.0";

our $metadata = {
    name            => 'DLScanner Plugin',
    author          => 'Kyle M Hall',
    description     => 'A Koha plugin that adds the ability to create HTML DLScanner via the REST API.',
    date_authored   => '2019-10-25',
    date_updated    => '2019-10-25',
    minimum_version => '19.05',
    maximum_version => undef,
    version         => $VERSION,
};

sub new {
    my ( $class, $args ) = @_;

    ## We need to add our metadata here so our base class can access it
    $args->{'metadata'} = $metadata;
    $args->{'metadata'}->{'class'} = $class;

    ## Here, we call the 'new' method for our base class
    ## This runs some additional magic and checking
    ## and returns our actual $self
    my $self = $class->SUPER::new($args);

    # Need to set up initial use of versioning
    my $installed        = $self->retrieve_data('__INSTALLED__');
    my $database_version = $self->retrieve_data('__INSTALLED_VERSION__');
    my $plugin_version   = $self->get_metadata->{version};
    if ( $installed && !$database_version ) {
        $self->upgrade();
        $self->store_data( { '__INSTALLED_VERSION__' => $plugin_version } );
    }

    return $self;
}

sub intranet_js {
    my ( $self ) = @_;

    return q|
        <script>
            console.log("Thanks for testing the kitchen sink plugin!");

            $( "#entryform" ).before(`
                <fieldset class="rows" id="dl-scan">
                    <legend id="dl-scan_lgd">Import address from drivers license</legend>
                    <label for="dl-data">Scan drivers license:</label>
                    <textarea id="dl-data"></textarea>
                </fieldset>
            `);

            $(document).ready(function () {
                let lastUpdate;
                let dlInterval;
                $("#dl-data").bind('input propertychange', function(){
                    lastUpdate = new Date().getTime();
                    if ( !dlInterval ) {
                        dlInterval = window.setInterval(function () {
                            let newUpdate = new Date().getTime();

                            console.log(newUpdate - lastUpdate);
                            if ( newUpdate - lastUpdate > 100 ) {
                                clearInterval(dlInterval);
                                dlInterval = null;
                                lastUpdate = null;
                                var lines = $('#dl-data').val().split('\n');
                                $('#dl-data').val("");
                                for( var i = 0 ; i < lines.length ; i++ ){
                                    const line = lines[i];
                                    const code = line.substring(0, 3);
                                    const value = line.substring(3);

                                    switch(code) {
                                        case 'DAG':
                                            $('#address').val(value);
                                            break;
                                        case 'DAI':
                                            $('#city').val(value);
                                            break;
                                        case 'DAJ':
                                            $('#state').val(value);
                                            break;
                                        case 'DAK':
                                            $('#zipcode').val(value);
                                            break;
                                    }
                                }
                            }
                        }, 10);
                    }
                });
            });
        </script>
    |;
}

sub upgrade {
    my ( $self, $args ) = @_;
    return 1;
}

sub install() {
    my ( $self, $args ) = @_;
    return 1;
}

sub uninstall() {
    my ( $self, $args ) = @_;
    return 1;
}

1;
