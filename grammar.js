module.exports = grammar({
    name: 'helios',

    extras: $ => [
        $._comment,
        /\s/
    ],
    
    word: $ => $.identifier,

    externals: $ => [
        $.dummy_token
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
            choice('testing', 'spending', 'minting'),
            field('script_name', $.identifier),
        ),

        // Statements
        
        block: $ => seq(
            '{',
            repeat(choice($.print_expression, $.assignment_expression)),
            $._value_expression,
            '}'
        ),

        main_function_statement: $ => seq(
            'func',
            'main',
            '(',
            optional(field('args', $.func_args)),
            ')',
            '->',
            field('return_type', $.bool_type),
            $.block
        ),

        function_statement: $ => seq(
            'func',
            field('name', $.identifier),
            '(',
            optional(field('args', $.func_args)),
            ')',
            '->',
            field('return_type', $.type),
            $.block
        ),

        method_statement: $ => seq(
            'func',
            field('name', $.identifier),
            '(',
            $._method_args,
            ')',
            '->',
            field('return_type', $.type),
            $.block
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

        parameter: $ => seq(
            field('name', $.identifier),
            ':',
            field('type', $.type)
        ),

        data_field: $ => seq(
            field('name', $.identifier),
            ':',
            field('type', $.type)
        ),

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
            $.func_type,
            $.nonfunc_type,
        ),

        func_type: $ => seq(
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

        nonfunc_type: $ => choice(
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

        ref_type: $ => field('name', $.identifier),

        path_type: $ => prec(1, seq(
            $.nonfunc_type, '::', choice(field('name', $.identifier), $.dummy_token)
            // external scanner inserts a dummy token after `::` if there is no 
            // character following it
        )),

        list_type: $ => prec(2, seq(
            '[', ']', $.nonfunc_type
        )),

        map_type: $ => prec(2, seq(
            'Map', '[', $.nonfunc_type, ']', $.nonfunc_type
        )),

        option_type: $ => seq(
            'Option', '[', $.nonfunc_type, ']'
        ),

        // Expressions

        _value_expression: $ => choice(
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
            $.nonfunc_type, '::', choice(field('name', $.identifier), $.dummy_token)
            // external scanner inserts a dummy token after `::` if there is no 
            // character following it
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

        int_literal: $ => choice(
            /[0-9]+/,
            /0b[0-1]+/,
            /0o[0-7]+/,
            /0x[0-9a-f]+/
         ),

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
            $.block
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
            $.terminator
        )),

        print_expression: $ => prec.right(0, seq(
            'print',
            '(',
            $._value_expression,
            ')',
            $.terminator
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
            $._value_expression, 
            '.', 
            choice(field('name', $.identifier), $.dummy_token)
            // external scanner inserts a dummy token after `.` if there is
            // no character following it
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
            seq('if', '(', $._value_expression, ')', $.block),
            repeat(seq('else', 'if', '(', $._value_expression, ')', $.block)),
            choice(seq('else', $.block), $.dummy_token))
        ),

        switch_expression: $ => prec.left(8, seq(
            $._value_expression,
            '.',
            'switch',
            '{',
            seq(
                $._switch_case,
                repeat(seq(',', $._switch_case)),
            ),
            '}'
        )),
   
        variant_rename: $ => field('variant_rename', seq(
            field('name', $.identifier), ':', field('variant', $.identifier)
        )),

        _switch_case: $ => seq(
            choice(
               field('variant', $.identifier), 
               $.variant_rename
            ), 
            '=>',
            choice(
               $._value_expression,
               $.block
            )
        ),

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        terminator: $ => ';',

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
