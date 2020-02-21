import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai'; 
import sinon from 'sinon';
import RegistrationForm from '../../../client/components/RegistrationForm.js';

describe('<RegistrationForm />', function() {

    it('Updates state when the `name` input changes', function() {
        const wrapper = shallow(<RegistrationForm />);
        wrapper.find('input[name="name"]').simulate('change', { target: { name: 'name', value: 'John Doe' } });
        expect(wrapper.state().name).to.equal('John Doe');
    
    });

    it('Updates state when the `email` input changes', function() {
        const wrapper = shallow(<RegistrationForm />);
        wrapper.find('input[name="email"]').simulate('change', { target: { name: 'email', value: 'john.doe@email.com' } });
        expect(wrapper.state().email).to.equal('john.doe@email.com');
    });


    it('Updates state when the `password` input changes', function() {
        const wrapper = shallow(<RegistrationForm />);
        wrapper.find('input[name="password"]').simulate('change', { target: { name: 'password', value: 'p4ssw0rd' } });
        expect(wrapper.state().password).to.equal('p4ssw0rd');
    });
    
    it('Updates state when the `confirmPassword` input changes', function() {
        const wrapper = shallow(<RegistrationForm />);
        wrapper.find('input[name="confirmPassword"]').simulate('change', { target: { name: 'confirmPassword', value: 'p4ssw0rd' } });
        expect(wrapper.state().confirmPassword).to.equal('p4ssw0rd');
    });

    it('Calls `onSubmit()` when the form is submitted', function() {
        const onSubmit = sinon.spy();
        const event = { preventDefault: function() {} };
        const wrapper = shallow(<RegistrationForm onSubmit={onSubmit} />);
        wrapper.find('form').simulate('submit', event);
        expect(onSubmit.called).to.equal(true);
    });

});
