/**
 * Iinitialize the fields table with the base set of academic fields we want to
 * have available at launch.  We're going to base these off of the outlines on
 * wikipedia, however, it's going to be messy because those outlines aren't
 * even self consistent.
 * 
 * Once we launch, these will evolve through suggested changes by the user
 * community.
 */

INSERT INTO fields (name, type, created_date, updated_date) 
    VALUES 
        ('physics', 'physics', now(), now()), /* 1 */
        ('chemistry', 'chemistry', now(), now()), /* 2 */
        ('biology', 'biology', now(), now()), /* 3 */
        ('earth-science', 'earth-science', now(), now()), /* 4 */
        ('space-science', 'space-science', now(), now()), /* 5 */ 
        ('anthropology', 'anthropology', now(), now()), /* 6 */
        ('archaeology', 'archaeology', now(), now()), /* 7 */ 
        ('economics', 'economics', now(), now()), /* 8 */ 
        ('geography', 'geography', now(), now()), /* 9 */
        ('political-science', 'political-science', now(), now()), /* 10 */
        ('psychology', 'psychology', now(), now()), /* 11 */
        ('sociology', 'sociology', now(), now()), /* 12 */
        ('social-work', 'social-work', now(), now()), /* 13 */
        ('computer-science', 'computer-science', now(), now()), /* 14 */
        ('mathematics', 'mathematics', now(), now()), /* 15 */
        ('agriculture', 'agriculture', now(), now()),
        ('architecture', 'architecture', now(), now()),
        ('business', 'business', now(), now()),
        ('education', 'education', now(), now()),
        ('engineering', 'engineering', now(), now()),
        ('environmental-studies', 'environmental-studies', now(), now()),
        ('consumer-science', 'consumer-science', now(), now()),
        ('recreation', 'recreation', now(), now()),
        ('media-studies', 'media-studies', now(), now()),
        ('law', 'law', now(), now()),
        ('library-science', 'library-science', now(), now()),
        ('medicine', 'medicine', now(), now()),
        ('military-science', 'military-science', now(), now()),
        ('public-administration', 'public-administration', now(), now()),
        ('transportation', 'transportation', now(), now()),

        /********** physics ********************/
        ('acoustics', 'physics', now(), now()),
        ('applied-physics', 'physics', now(), now()),
        ('astrophysics', 'physics-space-science', now(), now()),
            ('compact-objects', 'physics-space-science', now(), now()),
            ('physical-cosmology', 'physics-space-science', now(), now()),
            ('quantum-cosmology', 'physics-space-science', now(), now()),
            ('computational-astrophysics', 'physics-space-science', now(), now()),
            ('galactic-astronomy', 'physics-space-science', now(), now()),
            ('high-energy-astrophysics', 'physics-space-science', now(), now()),
            ('interstellar-astrophysics', 'physics-space-science', now(), now()),
            ('extragalactic-astronomy', 'physics-space-science', now(), now()),
            ('stellar-astronomy', 'physics-space-science', now(), now()),
            ('plasma-astrophysics', 'physics-space-science', now(), now()),
            ('relativistic-astrophysics', 'physics-space-science', now(), now()),
            ('plasma-astrophysics', 'physics-space-science', now(), now()),
            ('solar-physics', 'physics-space-science', now(), now()),
        ('atmospheric-physics', 'physics', now(), now()),
        ('atomic-molecular-optical-physics', 'physics', now(), now()),
            ('optics', 'physics', now(), now()),
        ('biophysics', 'physics-biology', now(), now()),
            ('neurophysics', 'physics-biology', now(), now()),
            ('polymer-physics', 'physics-biology', now(), now()),
            ('quantum-biology', 'physics-biology', now(), now()),
        ('chemical-physics', 'physics-chemistry', now(), now()),
        ('computational-physics', 'physics', now(), now()),
        ('condensed-matter-physics', 'physics', now(), now()),
        ('cryogenics', 'physics', now(), now()),
        ('electricity', 'physics', now(), now()),
        ('electromagnetism', 'physics', now(), now()),
        ('experimental-physics', 'physics', now(), now()),
        ('geophysics', 'physics', now(), now()),
        ('magnetisim', 'physics', now(), now()),
        ('mathematical-physics', 'physics', now(), now()),
        ('mechanics', 'physics', now(), now()),
            ('aerodynamics', 'physics', now(), now()),
            ('biomechanics', 'physics-biology', now(), now()),
            ('classical-mechanics', 'physics', now(), now()),
                ('kinematics', 'physics', now(), now()),
            ('continuum-mechanics', 'physics', now(), now()),
            ('dynamics', 'physics', now(), now()),
            ('fluid-mechanics', 'physics', now(), now()),
                ('fluid-dynamics', 'physics', now(), now()),
                ('fluid-kinematics', 'physics', now(), now()),
                ('fluid-statics', 'physics', now(), now()),
            ('statics', 'physics', now(), now()),
        ('medical-physics', 'physics-medicine', now(), now()),
        ('newtonian-dynamics', 'physics', now(), now()),
        ('nuclear-physics', 'physics', now(), now()),
        ('partical-physics', 'physics', now(), now()),
        ('plasma-physics', 'physics', now(), now()),
        ('quantum-physics', 'physics', now(), now()),
            ('quantum-field-theory', 'physics', now(), now()),
            ('quantum-information-theory', 'physics', now(), now()),
            ('quantum-foundations', 'physics', now(), now()),
        ('quantum-gravity', 'physics', now(), now()),
        ('relativity', 'physics', now(), now()),
            ('general-relativity', 'physics', now(), now()),
            ('special-relativity', 'physics', now(), now()),
        ('solid-mechanics', 'physics', now(), now()),
        ('solid-state-physics', 'physics', now(), now()),
        ('statistical-mechanics', 'physics', now(), now()),
        ('theoretical-physics', 'physics', now(), now()),
        ('thermal-physics', 'physics', now(), now()),
        ('thermodynamics', 'physics', now(), now()),

        /********** Space Science **************/
        ('astronomy', 'space-science', now(), now()),
            ('planetary-science', 'space-science', now(), now()),
                ('atmospheric-science', 'space-science', now(), now()),
                ('exoplanetology', 'space-science', now(), now()),
                ('planet-formation', 'space-science', now(), now()),
                ('magnetospheres', 'space-science', now(), now()),
                ('planetary-surfaces', 'space-science', now(), now()),
                ('planetary-interiors', 'space-science', now(), now()),
                ('small-solar-system-bodies', 'space-science', now(), now()),
            ('astrometry', 'space-science', now(), now()),
            ('observational-astronomy', 'space-science', now(), now()),
                ('radio-astronomy', 'space-science', now(), now()),
                ('submillimeter-astronomy', 'space-science', now(), now()),
                ('infrared-astronomy', 'space-science', now(), now()),
                ('xray-astronomy', 'space-science', now(), now()),
                ('optical-astronomy', 'space-science', now(), now()),
                ('ultraviolet-astronomy', 'space-science', now(), now()),
                ('gramma-ray-astronomy', 'space-science', now(), now()),
                ('cosmic-ray-astronomy', 'space-science', now(), now()),
                ('neutrino-astronomy', 'space-science', now(), now()),
                ('gravitational-wave-astronomy', 'space-science', now(), now()),
            ('astronomical-photometry', 'space-science', now(), now()),
            ('astronomical-spectroscopy', 'space-science', now(), now());



/**
 * Build the parent relationships. We're going to create a temporary table from the cross join of fields against itself
 * because that's going to make it really easy for us to build the tagging table by just selecting the pairs we want
 * from the cross join table.  We're doing this so that we don't have to manually track IDs when we're entering or
 * modifying the base fieldset.  This might make start up of the database container kind of slow, but we'll gain that time
 * back in the time we spend building the initial field heirarchy.  Initializing the database schema is something we should
 * only have to do once on production, and in the future we'll use database dumps.  So this is a slightly over-engineering
 * optimization for our development time during the alpha phase when we're still manually building the field tree. 
 */

/* Create the table. */
CREATE TABLE fields_cross AS 
    SELECT 
        parent.id AS parent_id, parent.name AS parent_name, child.id AS child_id, child.name AS child_name 
    FROM fields parent CROSS JOIN fields child;

/* Okay, now insert into the relationships table by selecting pairs from the fields_cross table. */

/* physics */
insert INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='physics' 
        AND  ( 
            child_name='acoustics'
            OR child_name='applied-physics'
            OR child_name='astrophysics'
            OR child_name='atmospheric-physics'
            OR child_name='atomic-molecular-optical-physics'
            OR child_name='biophysics'
            OR child_name='chemical-physics'
            OR child_name='computational-physics'
            OR child_name='condensed-matter-physics'
            OR child_name='cryogenics'
            OR child_name='electricity'
            OR child_name='electromagnetism'
            OR child_name='experimental-physics'
            OR child_name='fluid-dynamics'
            OR child_name='geophysics'
            OR child_name='magnetisim'
            OR child_name='mathematical-physics'
            OR child_name='mechanics'
            OR child_name='medical-physics'
            OR child_name='newtonian-dynamics'
            OR child_name='nuclear-physics'
            OR child_name='partical-physics'
            OR child_name='plasma-physics' 
            OR child_name='quantum-physics'
            OR child_name='quantum-gravity'
            OR child_name='relativity'
            OR child_name='solid-mechanics'
            OR child_name='solid-state-physics'
            OR child_name='statistical-mechanics'
            OR child_name='theoretical-physics'
            OR child_name='thermal-physics'
            OR child_name='thermodynamics'
        );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='astrophysics' 
            AND  ( 
                child_name='compact-objects'
                OR child_name='physical-cosmology'
                OR child_name='quantum-cosmology'
                OR child_name='computational-astrophysics'
                OR child_name='galactic-astronomy'
                OR child_name='high-energy-astrophysics'
                OR child_name='interstellar-astrophysics'
                OR child_name='extragalactic-astronomy'
                OR child_name='stellar-astronomy'
                OR child_name='plasma-astrophysics'
                OR child_name='relativistic-astrophysics'
                OR child_name='plasma-astrophysics'
                OR child_name='solar-physics'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='atomic-molecular-optical-physics' 
            AND  ( 
                child_name='optics'
            );

insert INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='biology' 
        AND  ( 
            child_name='biophysics'
        );
        
    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='biophysics' 
            AND  ( 
                child_name='neurophysics'
                OR child_name='polymer-physics'
                OR child_name='quantum-biology'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='mechanics' 
            AND  ( 
                child_name='aerodynamics'
                OR child_name='biomechanics'
                OR child_name='classical-mechanics'
                OR child_name='continuum-mechanics'
                OR child_name='dynamics'
                OR child_name='fluid-mechanics'
                OR child_name='statics'
            );


        insert INTO field_relationships (parent_id, child_id) 
            SELECT parent_id, child_id FROM fields_cross
                WHERE parent_name='classical-mechanics' 
                AND  ( 
                    child_name='kinematics'
                );


        insert INTO field_relationships (parent_id, child_id) 
            SELECT parent_id, child_id FROM fields_cross
                WHERE parent_name='fluid-mechanics' 
                AND  ( 
                    child_name='fluid-dynamics'
                    OR child_name='fluid-kinematics'
                    OR child_name='fluid-statics'
                );
        
    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='quantum-physics' 
            AND  ( 
                child_name='quantum-field-theory'
                OR child_name='quantum-information-theory'
                OR child_name='quantum-foundations'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='relativity' 
            AND  ( 
                child_name='general-relativity'
                OR child_name='special-relativity'
            );

/* space-science */
insert INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='space-science' 
        AND  ( 
            child_name='astronomy'
        );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='astronomy' 
            AND  ( 
                child_name='planetary-science'
                OR child_name='astrometry'
                OR child_name='observational-astronomy'
                OR child_name='astronomical-photometry'
                OR child_name='astronomical-spectroscopy'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='planetary-science' 
            AND  ( 
                child_name='atmospheric-science'
                OR child_name='exoplanetology'
                OR child_name='planet-formation'
                OR child_name='magnetospheres'
                OR child_name='planetary-surfaces'
                OR child_name='planetary-interiors'
                OR child_name='small-solar-system-bodies'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='observational-astronomy' 
            AND  ( 
                child_name='radio-astronomy'
                OR child_name='submillimeter-astronomy'
                OR child_name='infrared-astronomy'
                OR child_name='xray-astronomy'
                OR child_name='optical-astronomy'
                OR child_name='ultraviolet-astronomy'
                OR child_name='gramma-ray-astronomy'
                OR child_name='cosmic-ray-astronomy'
                OR child_name='neutrino-astronomy'
                OR child_name='gravitational-wave-astronomy'
            );
