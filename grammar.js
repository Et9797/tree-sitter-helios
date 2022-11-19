module.exports = grammar({
    name: 'helios',
      
    extras: $ => [
        $._comment,
        /\s/
    ],

    word: $ => $.identifier,

    conflicts: $ => [
        [$.path_type, $.list_type],
        [$.path_type, $.map_type],
        [$.value_ref_expression, $.assignment_expression],
        [$.ref_type, $.assignment_expression],
        [$.ref_type, $.value_ref_expression]
    ],

    rules: {
        source_file: $ => seq(
            $.script_purpose,
            repeat(
                choice(
                    $.function_statement,
                    $.struct_statement,
                    $.enum_statement,
                    $.const_statement,
                )
            ),
            $.main_function_statement,
            repeat(
                choice(
                    $.function_statement,
                    $.struct_statement,
                    $.enum_statement,
                    $.const_statement
                )
            )
        ),

        script_purpose: $ => seq(
            choice('spending', 'testing', 'minting'),
            field('script_name', $.identifier),
        ),

        // Statements

        main_function_statement: $ => seq(
            'func',
            'main',
            '(',
            optional(field('args', $.func_args)),
            ')',
            '->',
            field('return_type', $.bool_type),
            '{',
            $._value_expression,
            '}'
        ),

        function_statement: $ => seq(
            'func',
            field('name', $.identifier),
            '(',
            optional(field('args', $.func_args)),
            ')',
            '->',
            field('return_type', $.type),
            '{',
            $._value_expression,
            '}'
        ),

        method_statement: $ => seq(
            'func',
            field('name', $.identifier),
            '(',
            $._method_args,
            ')',
            '->',
            field('return_type', $.type),
            '{',
            $._value_expression,
            '}'
        ),

        func_args: $ => seq(
            $.parameter,
            repeat(seq(',', $.parameter))
        ),

        _method_args: $ => seq(
            'self',
            optional(
                seq(
                    ',',
                    field('args', $.func_args)
                )
            )
        ),

        _name_type_pair: $ => seq(
            field('name', $.identifier),
            ':',
            field('type', $.type)
        ),

        parameter: $ => alias($._name_type_pair, "parameter"),

        data_field: $ => alias($._name_type_pair, "data_field"),

        struct_statement: $ => seq(
            'struct',
            field('name', $.identifier),
            '{',
            repeat1($.data_field),
            repeat(
                choice(
                    $.const_statement,
                    $.function_statement,
                    $.method_statement
                )
            ),
            '}'
        ),

        enum_statement: $ => seq(
            'enum',
            field('name', $.identifier),
            '{',
            repeat1($.enum_variant),
            repeat(
                choice(
                    $.const_statement,
                    $.function_statement,
                    $.method_statement
                )
            ),
            '}'
        ),

        enum_variant: $ => seq(
            field('name', $.identifier),
            optional(
                seq(
                    '{',
                    repeat1($.data_field),
                    '}'
                )
            )
        ),

        const_statement: $ => seq(
            'const',
            field('name', $.identifier),
            optional(
                seq(
                    ':',
                    field('type', $.type)
                )
            ),
            '=',
            $._value_expression
        ),

        // Types

        type: $ => choice(
            $._func_type,
            $._nonfunc_type,
        ),

        _func_type: $ => seq(
            '(',
            optional(
                seq(
                    $.type,
                    repeat(seq(',', $.type))
                )
            ),
            ')',
            '->',
            field('return_type', $.type)
        ),

        _nonfunc_type: $ => choice(
            $._primitive_type,
            $.ref_type,
            $.path_type,
            $.list_type,
            $.map_type,
            $.option_type
        ),

        _primitive_type: $ => choice(
            $.bool_type,
            $.int_type,
            $.str_type,
            $.bytearray_type
        ),

        bool_type: $ => "Bool",

        int_type: $ => "Int",

        str_type: $ => "String",

        bytearray_type: $ => "ByteArray",

        path_type: $ => seq(
            $._nonfunc_type, '::', field('name', $.identifier)
        ),

        ref_type: $ => field('name', $.identifier),

        list_type: $ => seq(
            '[', ']', $._nonfunc_type
        ),

        map_type: $ => seq(
            'Map', '[', $._nonfunc_type, ']', $._nonfunc_type
        ),

        option_type: $ => seq(
            'Option', '[', $._nonfunc_type, ']'
        ),

        // Expressions

        _value_expression: $ => choice(
            $.print_expression,
            $.assignment_expression,
            $.literal_expression,
            $.value_ref_expression,
            $.value_path_expression,
            $.unary_expression,
            $.binary_expression,
            $.parens_expression,
            $.call_expression,
            $.member_expression,
            $.ifelse_expression,
            $.switch_expression
        ),

        value_ref_expression: $ => field('name', $.identifier),

        value_path_expression: $ => prec.left(8, seq(
            $._nonfunc_type, '::', field('name', $.identifier)
        )),

        literal_expression: $ => choice(
            $._primitive_literal,
            $.struct_literal,
            $.list_literal,
            $.map_literal,
            $.func_literal
        ),

        _primitive_literal: $ => choice(
            $.int_literal,
            $.bool_literal,
            $.string_literal,
            $.bytearray_literal
        ),

        int_literal: $ => /[0-9]+/,
            ///0b[0-1]+/,
            ///0o[0-7]+/,
            ///0x[0-9a-f]+/

        bool_literal: $ => choice('true', 'false'),

        string_literal: $ => seq(
            '"',
            /[^"]*/,
            '"'
        ),

        bytearray_literal: $ => seq('#', /[0-9a-f]*/),

        struct_literal: $ => prec.left(8, seq(
            choice(field('struct_identifier', $.identifier), $.path_type),
            seq(
                '{',
                seq(
                    optional(seq(field('struct_field', $.identifier), ':')),
                    $._value_expression
                ),
                repeat(
                    seq(
                        ',',
                        optional(seq(field('struct_field', $.identifier), ':')),
                        $._value_expression
                    ),
                ),
                '}'
            )
        )),

        list_literal: $ => prec.left(8, seq(
            $.list_type,
            '{',
            optional(
                seq(
                    $._value_expression,
                    repeat(seq(',', $._value_expression))
                )
            ),
            '}'
        )),

        map_literal: $ => prec.left(8, seq(
            $.map_type,
            '{',
            optional(
                seq(
                    seq($._value_expression, ':', $._value_expression),
                    repeat(seq(',', $._value_expression, ':', $._value_expression))
                )
            ),
            '}'
        )),

        func_literal: $ => prec.left(8, seq(
            '(',
            optional(field('args', $.func_args)),
            ')',
            '->',
            field('return_type', $.type),
            '{',
            $._value_expression,
            '}'
        )),

        assignment_expression: $ => prec.right(0, seq(
            field('name', $.identifier),
            optional(
                seq(
                    ':',
                    field('type', $.type)
                )
            ),
            '=',
            $._value_expression,
            $._terminator,
            $._value_expression
        )),

        print_expression: $ => prec.right(0, seq(
            'print',
            '(',
            $._value_expression,
            ')',
            $._terminator,
            $._value_expression
        )),

        unary_expression: $ => prec.right(7, seq(
            choice('-', '+', '!'),
            $._value_expression
        )),

        binary_expression: $ => choice(
            prec.left(1, seq($._value_expression, '||', $._value_expression)),
            prec.left(2, seq($._value_expression, '&&', $._value_expression)),
            prec.left(3, seq($._value_expression, choice('==', '!='), $._value_expression)),
            prec.left(4, seq($._value_expression, choice('<', '>', '<=', '>='), $._value_expression)),
            prec.left(5, seq($._value_expression, choice('+', '-'), $._value_expression)),
            prec.left(6, seq($._value_expression, choice('*', '/', '%'), $._value_expression)),
        ),

        parens_expression: $ => prec(9, seq(
            '(',
            $._value_expression,
            ')'
        )),

        member_expression: $ => prec.left(8, seq(
            $._value_expression, '.', field('name', $.identifier)
        )),

        call_expression: $ => prec.left(8, seq(
            $._value_expression,
            '(',
            optional(
                seq(
                    $._value_expression,
                    repeat(seq(',', $._value_expression))
                )
            ),
            ')'
        )),

        ifelse_expression: $ => prec.left(8, seq(
            'if',
            '(',
            $._value_expression,
            ')',
            '{',
            $._value_expression,
            '}',
            repeat(seq(
                'else if',
                '(',
                $._value_expression,
                ')',
                '{',
                $._value_expression,
                '}'
            )),
            'else',
            '{',
            $._value_expression,
            '}'
        )),

        switch_expression: $ => prec.left(8, seq(
            $._value_expression,
            '.',
            'switch',
            '{',
            seq(
                $.switch_case,
                repeat(seq(',', $.switch_case)),
            ),
            '}'
        )),

        if_block: $ => 'if',

        switch_case: $ => seq(
            choice($.identifier, seq($.identifier, ':', $.identifier)), 
            '=>',
            $.switch_value_expr
        ),

        switch_value_expr: $ => choice(
            $._value_expression,
            seq(
                '{',
                $._value_expression,
                '}'
            )
        ),

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        _terminator: $ => ';',

        _comment: $ => token(choice(
            seq('//', /.*/),
            seq(
                '/*',
                /[^*]*\*+([^/*][^*]*\*+)*/,
                '/'
            )
        ))
    }
})

